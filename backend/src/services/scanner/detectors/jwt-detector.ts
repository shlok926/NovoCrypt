import { ScanContext, ScanFinding, TargetType, DetectorMetadata, Evidence, Rule, DetectionContext, SupportLevel, DetectionSupport, LanguageSupportMatrix, KnownBypassMatrix } from '../types';
import { BaseDetector } from '../framework/BaseDetector';
import { TokenAnalyzer } from './jwt-token-analyzer';
import { SignatureAnalyzer } from './jwt-signature-analyzer';
import { ClaimsAnalyzer } from './jwt-claims-analyzer';
import { KeyManagementAnalyzer } from './jwt-key-management-analyzer';
import { StorageAnalyzer } from './jwt-storage-analyzer';
import { ReplayProtectionAnalyzer as ReplayAnalyzer } from './jwt-replay-analyzer';
import { ApiUsageAnalyzer } from './jwt-api-usage-analyzer';
import { LibraryFingerprintAnalyzer } from './jwt-library-fingerprint-analyzer';
import { JwtBestPracticesAnalyzer } from './jwt-best-practices-analyzer';
import { jwtRules } from './jwt-rule-catalog';
import { JwtEvidence, SecretClassification } from './jwt-types';
import { TelemetryService } from '../../observability';

export class JwtDetector extends BaseDetector {
  id = 'detector-jwt';
  name = 'JWT / JWS / JWE Security Analyzer';
  version = '1.0.0';
  category = 'JSON Web Tokens';
  supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'csharp'];
  supportedExtensions = ['.js', '.ts', '.py', '.java', '.go', '.cs', '.json', '.yaml', '.yml'];

  languageMatrix: LanguageSupportMatrix = {
    supportedLanguages: this.supportedLanguages,
    languages: this.supportedLanguages.map(lang => ({
      language: lang,
      supportLevel: SupportLevel.FULL,
      notes: 'Token parsing and verification audits supported'
    }))
  };

  bypassMatrix: KnownBypassMatrix = {
    regex: DetectionSupport.FULL,
    templateLiterals: DetectionSupport.FULL,
    stringConcatenation: DetectionSupport.FULL,
    aliases: DetectionSupport.PARTIAL,
    factories: DetectionSupport.AST_REQUIRED,
    reflection: DetectionSupport.AST_REQUIRED,
    dynamicImports: DetectionSupport.AST_REQUIRED,
    unicode: DetectionSupport.PARTIAL,
    base64: DetectionSupport.FULL,
    hex: DetectionSupport.PARTIAL,
    environmentVariables: DetectionSupport.PARTIAL,
    wrapperMethods: DetectionSupport.AST_REQUIRED
  };

  capabilities = {
    id: 'jwt-security',
    version: '1.0.0',
    category: ['Authentication', 'Authorization', 'Cryptography'],
    supportsRegex: true,
    supportsCrossFileCorrelation: true,
    supportsTemplateResolution: true,
    supportsStaticAnalysis: true,
    supportsLanguageAwareness: true,
    supportsAST: false,
    supportsRuntimeAnalysis: false,
    supportsDataFlow: false,
    supportsReflection: false,
    supportsSecretsCorrelation: true,
    supportsNetworkInspection: false
  };

  metadata: DetectorMetadata = {
    version: '1.0.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v1',
    category: 'JSON Web Tokens',
    documentationUrl: 'https://docs.novocrypt.app/detectors/jwt',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions,
    capabilities: this.capabilities,
    languageMatrix: this.languageMatrix,
    bypassMatrix: this.bypassMatrix
  };

  supportedTargets: TargetType[] = ['code', 'config'];

  private tokenAnalyzer = new TokenAnalyzer();
  private signatureAnalyzer = new SignatureAnalyzer();
  private claimsAnalyzer = new ClaimsAnalyzer();
  private keyMgmtAnalyzer = new KeyManagementAnalyzer();
  private storageAnalyzer = new StorageAnalyzer();
  private replayAnalyzer = new ReplayAnalyzer();
  private apiUsageAnalyzer = new ApiUsageAnalyzer();
  private libraryAnalyzer = new LibraryFingerprintAnalyzer();
  private bestPracticesAnalyzer = new JwtBestPracticesAnalyzer();

  protected async executeDetection(context: ScanContext, detectionContext?: DetectionContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const sourceFile = context.fileName || 'unknown_file';

    if ((context.targetType === 'code' || context.targetType === 'config') && typeof context.target === 'string') {
      const start = performance.now();
      const targetCode = context.target;

      // --- Performance Budget Checks ---
      // 1. Target code size limit: 100 KB
      if (targetCode.length > 100 * 1024) {
        TelemetryService.recordCounter('jwt.scan.skipped.size', 1);
        return [];
      }

      const lines = targetCode.split('\n');
      const fileLibrary = this.libraryAnalyzer.analyzeLine(targetCode);
      const libraryName = fileLibrary ? fileLibrary.library : 'jsonwebtoken';
      const languageName = fileLibrary ? fileLibrary.language : (context.language || 'unknown');

      // Detect OIDC/Identity Provider details
      let oidcProvider: string | undefined = undefined;
      if (/auth0/i.test(targetCode)) oidcProvider = 'Auth0';
      else if (/okta/i.test(targetCode)) oidcProvider = 'Okta';
      else if (/keycloak/i.test(targetCode)) oidcProvider = 'Keycloak';
      else if (/cognito/i.test(targetCode)) oidcProvider = 'AWS Cognito';
      else if (/firebase/i.test(targetCode)) oidcProvider = 'Firebase Authentication';

      // Detect general threat context
      let threatContext = 'Authentication';
      if (/authorize|permission|role|scope/i.test(targetCode)) {
        threatContext = 'Authorization';
      }

      // Calculate correlation globally per file check to link secrets with verifications
      let correlatedSecret = false;
      let secretSource = '';
      const correlationSources: string[] = [];

      const globalSecrets = context.sharedState.jwtSecrets;

      for (const [file, details] of globalSecrets.entries()) {
        if (file !== sourceFile) {
          correlatedSecret = true;
          correlationSources.push(`${file}:${details.line}`);
        }
      }
      if (correlationSources.length > 0) {
        secretSource = ` (Correlated with secret defined in ${correlationSources.join(', ')})`;
      }

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) return;

        // Use resolved string if template literal or string concatenation was resolved
        const resolvedItem = detectionContext?.resolvedStrings.get(lineNum);
        const lineToAnalyze = resolvedItem?.isResolved ? resolvedItem.resolved : trimmedLine;

        // Ast compatibility mock
        const astMock = undefined;

        // 2. Performance limit: check token length budget
        if (lineToAnalyze.length > 8192) {
          return; // skip parsing huge minified lines
        }

        // Run sub-analyzers
        const tokensFound = this.tokenAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const signatureIssue = this.signatureAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const claimsIssue = this.claimsAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const keyIssue = this.keyMgmtAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const storageIssue = this.storageAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const replayIssue = this.replayAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const apiUsageIssue = this.apiUsageAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const bestPractice = this.bestPracticesAnalyzer.analyzeLine(lineToAnalyze, astMock);

        // 1. Process Key Management & Secret Definitions (Store in cross-file cache)
        if (keyIssue) {
          TelemetryService.recordCounter('jwt.weak.secret', 1);
          let secType: SecretClassification = 'Hardcoded';
          if (keyIssue.issue === 'DefaultSecret') secType = 'Default';
          else if (keyIssue.issue === 'WeakSecret') secType = 'Weak';
          
          globalSecrets.set(sourceFile, {
            file: sourceFile,
            line: lineNum,
            secretType: secType
          });

          let ruleToUse = jwtRules.JWT005;
          if (keyIssue.issue === 'DefaultSecret' || keyIssue.issue === 'WeakSecret') {
            ruleToUse = jwtRules.JWT004;
          } else if (keyIssue.issue === 'UnsafeJWKS') {
            ruleToUse = jwtRules.JWT010;
          } else if (keyIssue.issue === 'DuplicateKid') {
            ruleToUse = jwtRules.JWT019;
          }
          
          findings.push(
            this.buildJwtFinding(ruleToUse, {
              tokenType: 'JWS',
              secretClassification: secType,
              language: languageName,
              api: keyIssue.api,
              library: libraryName,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 90,
              confidence: 95,
              recommendation: keyIssue.description,
              standardsReferences: ['RFC 7518', 'OWASP JWT Cheat Sheet']
            })
          );
        }

        // 2. Process token matches (JWS / JWE / alg=none)
        if (tokensFound.length > 0) {
          for (const token of tokensFound) {
            TelemetryService.recordCounter('jwt.tokens.detected', 1);
            let ruleToApply = jwtRules.JWT003; // default missing verify
            
            if (token.isUnsecured) {
              TelemetryService.recordCounter('jwt.alg.none', 1);
              ruleToApply = jwtRules.JWT001;
            } else if (token.type === 'JWE') {
              // Highlight insecure algorithm defaults for JWE
              if (token.alg && (token.alg.includes('RSA1_5') || token.alg.includes('dir'))) {
                TelemetryService.recordCounter('jwt.jwe.insecure', 1);
                ruleToApply = jwtRules.JWT017;
              }
            }

            findings.push(
              this.buildJwtFinding(ruleToApply, {
                tokenType: token.type,
                algorithm: token.alg,
                threatContext: threatContext,
                language: languageName,
                api: 'token pattern',
                library: libraryName,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 85,
                confidence: correlatedSecret ? 98 : 90,
                recommendation: ruleToApply.recommendation + secretSource,
                standardsReferences: ['RFC 7515', 'RFC 7519', 'RFC 8725']
              })
            );
          }
        }

        // 3. Process signature verifications / confusion
        if (signatureIssue) {
          TelemetryService.recordCounter('jwt.signature.missing', 1);
          let rule = jwtRules.JWT003;
          if (signatureIssue.issue === 'AlgorithmConfusion') {
            rule = jwtRules.JWT002;
          } else if (signatureIssue.issue === 'DisabledVerification') {
            rule = jwtRules.JWT003;
          }

          const hasAsymmetricContext = /publicKey|pem|cert|\.key|jwks|asymmetric|RS256/i.test(targetCode);
          const isHighSeverityConfusion = hasAsymmetricContext || correlatedSecret;
          
          let confidenceScore = 95;
          let ruleToUse = rule;

          if (signatureIssue.issue === 'AlgorithmConfusion') {
            if (isHighSeverityConfusion) {
              confidenceScore = correlatedSecret ? 98 : 95;
            } else {
              // Weak evidence only -> map to Hardening Recommendation rule with Low/Info level
              ruleToUse = jwtRules.JWTB001;
              confidenceScore = 65;
            }
          }

          const finding = this.buildJwtFinding(ruleToUse, {
            tokenType: 'JWS',
            threatContext: threatContext,
            language: languageName,
            api: signatureIssue.api,
            library: libraryName,
            file: sourceFile,
            line: lineNum,
            snippet: trimmedLine.substring(0, 200),
            detectorVersion: this.version,
            evidenceQuality: 95,
            confidence: confidenceScore,
            recommendation: signatureIssue.description + (isHighSeverityConfusion ? '' : ' (Hardening recommendation: specify allowed algorithms list to block confusion attacks)') + secretSource,
            standardsReferences: ['RFC 7515', 'RFC 8725 Section 3.1']
          });

          findings.push(finding);
        }

        // 4. Claims audits
        if (claimsIssue) {
          TelemetryService.recordCounter('jwt.claims.missing', 1);
          findings.push(
            this.buildJwtFinding(jwtRules.JWT006, {
              tokenType: 'JWS',
              language: languageName,
              api: claimsIssue.api,
              library: libraryName,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 90,
              confidence: 90,
              recommendation: claimsIssue.description,
              standardsReferences: ['RFC 7519 Section 4.1.4']
            })
          );
        }

        // 5. Storage leakage audits
        if (storageIssue) {
          if (storageIssue.issue === 'LocalStorageUsage') {
            TelemetryService.recordCounter('jwt.localstorage', 1);
            findings.push(
              this.buildJwtFinding(jwtRules.JWT012, {
                tokenType: 'JWS',
                storageLocation: 'localStorage',
                language: languageName,
                api: storageIssue.api,
                library: libraryName,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 95,
                confidence: 95,
                recommendation: storageIssue.description,
                standardsReferences: ['OWASP HTML5 Cheat Sheet']
              })
            );
          } else {
            TelemetryService.recordCounter('jwt.cookies.insecure', 1);
            findings.push(
              this.buildJwtFinding(jwtRules.JWT013, {
                tokenType: 'JWS',
                storageLocation: 'Cookie',
                language: languageName,
                api: storageIssue.api,
                library: libraryName,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 95,
                confidence: 95,
                recommendation: storageIssue.description,
                standardsReferences: ['OWASP Cookie Security Cheat Sheet']
              })
            );
          }
        }

        // 6. Replay resistance audits
        if (replayIssue) {
          TelemetryService.recordCounter('jwt.replay', 1);
          findings.push(
            this.buildJwtFinding(jwtRules.JWT011, {
              tokenType: 'JWS',
              language: languageName,
              api: replayIssue.api,
              library: libraryName,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 85,
              confidence: 90,
              recommendation: replayIssue.description,
              standardsReferences: ['RFC 7519 Section 4.1.7']
            })
          );
        }

        // 7. General API misuse validations
        if (apiUsageIssue) {
          let rule = jwtRules.JWT003;
          if (apiUsageIssue.issue === 'ExpiredTokenAccepted') {
            rule = jwtRules.JWT015;
          }

          findings.push(
            this.buildJwtFinding(rule, {
              tokenType: 'JWS',
              language: languageName,
              api: apiUsageIssue.api,
              library: libraryName,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 95,
              confidence: 95,
              recommendation: apiUsageIssue.description,
              standardsReferences: ['RFC 8725 Section 2.1']
            })
          );
        }

        // 8. Best Practices audits (Info severity only)
        if (bestPractice) {
          findings.push(
            this.buildJwtFinding(jwtRules.JWTB001, {
              tokenType: 'JWS',
              language: languageName,
              api: bestPractice.practice,
              library: libraryName,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 80,
              confidence: 90,
              recommendation: bestPractice.description,
              standardsReferences: ['RFC 8725']
            })
          );
        }
      });

      const duration = performance.now() - start;
      TelemetryService.recordHistogram('jwt.runtime.ms', duration);
      
      // Limit findings count to prevent file parsing floods
      if (findings.length > 50) {
        return findings.slice(0, 50);
      }
    }

    return this.deduplicateFindings(findings);
  }

  private buildJwtFinding(rule: Rule, evidence: JwtEvidence): ScanFinding {
    const standardEvidence: Evidence = {
      file: evidence.file,
      line: evidence.line,
      snippet: evidence.snippet,
      matchedPattern: evidence.api,
      language: evidence.language,
      qualityScore: evidence.evidenceQuality
    };

    const finding = this.buildFinding(rule, standardEvidence, evidence.confidence);

    finding.evidence = {
      ...finding.evidence,
      ...evidence
    } as any;

    return finding;
  }

  private deduplicateFindings(findings: ScanFinding[]): ScanFinding[] {
    const unique = new Map<string, ScanFinding>();
    for (const f of findings) {
      const key = `${f.ruleId}-${f.evidence.file}-${f.evidence.line}`;
      if (!unique.has(key)) {
        unique.set(key, f);
      } else {
        const existing = unique.get(key)!;
        if (f.confidence > existing.confidence) {
          unique.set(key, f);
        }
      }
    }
    return Array.from(unique.values());
  }
}
