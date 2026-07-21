import { ScanContext, ScanFinding, TargetType, DetectorMetadata, Evidence, Rule, DetectionContext, SupportLevel, DetectionSupport, LanguageSupportMatrix, KnownBypassMatrix } from '../types';
import { BaseDetector } from '../framework/BaseDetector';
import { AlgorithmAnalyzer } from './aes-algorithm-analyzer';
import { ModeAnalyzer } from './aes-mode-analyzer';
import { AEADAnalyzer } from './aes-aead-analyzer';
import { KdfAnalyzer } from './aes-kdf-analyzer';
import { KeyManagementAnalyzer } from './aes-key-management-analyzer';
import { IVAnalyzer } from './aes-iv-analyzer';
import { RandomnessAnalyzer } from './aes-randomness-analyzer';
import { PaddingAnalyzer } from './aes-padding-analyzer';
import { ApiUsageAnalyzer } from './aes-api-usage-analyzer';
import { LibraryFingerprintAnalyzer } from './aes-library-fingerprint-analyzer';
import { BestPracticesAnalyzer } from './aes-best-practices-analyzer';
import { aesRules } from './aes-rule-catalog';
import { AesEvidence, AesAlgorithm, AesMode, AesIVClassification, AesPadding, AesKdf } from './aes-types';
import { TelemetryService } from '../../observability';

export class AesDetector extends BaseDetector {
  id = 'detector-aes';
  name = 'AES Symmetric Encryption Security Analyzer';
  version = '1.0.0';
  category = 'Cryptography';
  supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'csharp', 'rust', 'c', 'cpp'];
  supportedExtensions = ['.js', '.ts', '.py', '.java', '.go', '.cs', '.rs', '.c', '.cpp', '.h', '.json', '.yaml', '.yml'];

  languageMatrix: LanguageSupportMatrix = {
    supportedLanguages: this.supportedLanguages,
    languages: this.supportedLanguages.map(lang => ({
      language: lang,
      supportLevel: SupportLevel.FULL,
      notes: 'Static string and regex pattern parsing supported'
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
    base64: DetectionSupport.PARTIAL,
    hex: DetectionSupport.PARTIAL,
    environmentVariables: DetectionSupport.PARTIAL,
    wrapperMethods: DetectionSupport.AST_REQUIRED
  };

  capabilities = {
    id: 'aes-security',
    version: '1.0.0',
    category: ['Cryptography', 'Symmetric Encryption'],
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
    category: 'Cryptography',
    documentationUrl: 'https://docs.novocrypt.app/detectors/aes',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions,
    capabilities: this.capabilities,
    languageMatrix: this.languageMatrix,
    bypassMatrix: this.bypassMatrix
  };

  supportedTargets: TargetType[] = ['code', 'config'];

  private algoAnalyzer = new AlgorithmAnalyzer();
  private modeAnalyzer = new ModeAnalyzer();
  private aeadAnalyzer = new AEADAnalyzer();
  private kdfAnalyzer = new KdfAnalyzer();
  private keyMgmtAnalyzer = new KeyManagementAnalyzer();
  private ivAnalyzer = new IVAnalyzer();
  private randomnessAnalyzer = new RandomnessAnalyzer();
  private paddingAnalyzer = new PaddingAnalyzer();
  private apiUsageAnalyzer = new ApiUsageAnalyzer();
  private libraryAnalyzer = new LibraryFingerprintAnalyzer();
  private bestPracticesAnalyzer = new BestPracticesAnalyzer();



  protected async executeDetection(context: ScanContext, detectionContext?: DetectionContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const sourceFile = context.fileName || 'unknown_file';

    if ((context.targetType === 'code' || context.targetType === 'config') && typeof context.target === 'string') {
      const start = performance.now();
      const targetCode = context.target;

      // --- Performance Budget Checks ---
      // 1. Target code size limit: 100 KB
      if (targetCode.length > 100 * 1024) {
        TelemetryService.recordCounter('aes.scan.skipped.size', 1);
        return [];
      }

      const lines = targetCode.split('\n');
      const fileLibrary = this.libraryAnalyzer.analyzeLine(targetCode);
      const libraryName = fileLibrary ? fileLibrary.library : 'Node crypto';
      const languageName = fileLibrary ? fileLibrary.language : (context.language || 'unknown');

      // Detect Usage Context Classification
      let usageContext = 'API Payload Encryption';
      if (/db|database|query|sql|prisma|collection/i.test(targetCode)) {
        usageContext = 'Database Encryption';
      } else if (/file|fs\.write|fs\.read|path|filename|filepath/i.test(targetCode)) {
        usageContext = 'File Encryption';
      } else if (/disk|mount|drive|volume/i.test(targetCode)) {
        usageContext = 'Disk Encryption';
      } else if (/tls|socket|https|connect|handshake/i.test(targetCode)) {
        usageContext = 'TLS Record Layer';
      } else if (/storage|localStorage|sessionStorage|keychain|securestore/i.test(targetCode)) {
        usageContext = 'Mobile Storage';
      } else if (/kms|vault|aws|gcp|azure|hsm/i.test(targetCode)) {
        usageContext = 'Cloud KMS';
      } else if (/secret|credential|config|settings/i.test(targetCode)) {
        usageContext = 'Secrets Management';
      }

      // Calculate cross-file correlation
      let correlatedKey = false;
      let keySources: string[] = [];
      const globalKeys = context.sharedState.aesKeys;
      for (const [file, details] of globalKeys.entries()) {
        if (file !== sourceFile) {
          correlatedKey = true;
          keySources.push(`${file}:${details.line}`);
        }
      }
      const correlationSuffix = keySources.length > 0 
        ? ` (Correlated with symmetric key configured in ${keySources.join(', ')})` 
        : '';

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) return;

        // Use resolved string if template literal or string concatenation was resolved
        const resolvedItem = detectionContext?.resolvedStrings.get(lineNum);
        const lineToAnalyze = resolvedItem?.isResolved ? resolvedItem.resolved : trimmedLine;

        // Ast compatibility mock
        const astMock = undefined;

        // 2. Performance limit: check statement length
        if (lineToAnalyze.length > 8192) return;

        // Run sub-analyzers
        const algoIssue = this.algoAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const modeIssue = this.modeAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const aeadIssue = this.aeadAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const kdfIssue = this.kdfAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const keyIssue = this.keyMgmtAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const ivIssue = this.ivAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const randomIssue = this.randomnessAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const paddingIssue = this.paddingAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const apiUsageIssue = this.apiUsageAnalyzer.analyzeLine(lineToAnalyze, astMock);
        const bestPractice = this.bestPracticesAnalyzer.analyzeLine(lineToAnalyze, astMock);

        // Standard References List
        const standards = ['NIST SP 800-38A', 'OWASP Cryptographic Storage Cheat Sheet'];

        // 1. Process Key Management
        if (keyIssue) {
          TelemetryService.recordCounter('aes.hardcoded.key', 1);
          let rule = aesRules.AES005;
          if (keyIssue.issue === 'DevelopmentKey') rule = aesRules.AES019;
          else if (keyIssue.issue === 'EmbeddedSecret') rule = aesRules.AES020;

          // Register in cache
          globalKeys.set(sourceFile, {
            file: sourceFile,
            line: lineNum,
            keyType: keyIssue.issue
          });

          findings.push(
            this.buildAesFinding(rule, {
              algorithm: 'Unknown',
              mode: 'Unknown',
              language: languageName,
              library: libraryName,
              usageContext,
              api: keyIssue.api,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 90,
              confidence: 95,
              recommendation: keyIssue.description,
              standardsReferences: [...standards, 'NIST SP 800-57']
            })
          );
        }

        // 2. Process Algorithm issues
        if (algoIssue) {
          TelemetryService.recordCounter('aes.detected', 1);
          if (algoIssue.isWeakSize) {
            findings.push(
              this.buildAesFinding(aesRules.AES006, {
                algorithm: algoIssue.algorithm,
                mode: 'Unknown',
                keySize: algoIssue.keySize,
                language: languageName,
                library: libraryName,
                usageContext,
                api: algoIssue.matchedString,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 95,
                confidence: 95,
                recommendation: `Weak/invalid AES key size detected: ${algoIssue.keySize} bits. Enforce standard key sizes (128, 192, 256 bits).`,
                standardsReferences: [...standards, 'FIPS 197']
              })
            );
          }
        }

        // 3. Process block cipher mode issues
        if (modeIssue) {
          if (modeIssue.issue === 'ECBMode') {
            TelemetryService.recordCounter('aes.ecb', 1);
            findings.push(
              this.buildAesFinding(aesRules.AES001, {
                algorithm: 'Unknown',
                mode: modeIssue.mode,
                language: languageName,
                library: libraryName,
                usageContext,
                api: modeIssue.mode,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 95,
                confidence: correlatedKey ? 98 : 95,
                recommendation: modeIssue.description + correlationSuffix,
                standardsReferences: [...standards, 'NIST SP 800-38A']
              })
            );
          } else if (modeIssue.issue === 'UnauthenticatedMode') {
            // Note: CBC/CTR modes are unauthenticated, mapped to AES008
            findings.push(
              this.buildAesFinding(aesRules.AES008, {
                algorithm: 'Unknown',
                mode: modeIssue.mode,
                language: languageName,
                library: libraryName,
                usageContext,
                api: modeIssue.mode,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 90,
                confidence: correlatedKey ? 98 : 90,
                recommendation: modeIssue.description + correlationSuffix,
                standardsReferences: [...standards, 'ISO/IEC 19772']
              })
            );
          }
        }

        // 4. Process AEAD tagging issues
        if (aeadIssue) {
          let rule = aesRules.AES009;
          if (aeadIssue.issue === 'WeakTagLength') rule = aesRules.AES021;
          else if (aeadIssue.issue === 'MissingAAD') rule = aesRules.AES022;

          findings.push(
            this.buildAesFinding(rule, {
              algorithm: 'Unknown',
              mode: 'GCM',
              language: languageName,
              library: libraryName,
              usageContext,
              api: aeadIssue.api,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 95,
              confidence: 95,
              recommendation: aeadIssue.description,
              standardsReferences: [...standards, 'NIST SP 800-38D']
            })
          );
        }

        // 5. Process Key Derivation Function parameters
        if (kdfIssue) {
          let rule = aesRules.AES010;
          if (kdfIssue.issue === 'WeakArgon2') rule = aesRules.AES011;
          else if (kdfIssue.issue === 'Weakscrypt') rule = aesRules.AES012;
          else if (kdfIssue.issue === 'WeakKDF') rule = aesRules.AES018;
          else if (kdfIssue.issue === 'PredictableSalt') rule = aesRules.AES024;
          else if (kdfIssue.issue === 'ReusedSalt') rule = aesRules.AES025;

          findings.push(
            this.buildAesFinding(rule, {
              algorithm: 'Unknown',
              mode: 'Unknown',
              language: languageName,
              library: libraryName,
              usageContext,
              api: kdfIssue.api,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 90,
              confidence: 90,
              recommendation: kdfIssue.description,
              standardsReferences: [...standards, 'NIST SP 800-132']
            })
          );
        }

        // 6. Process IV / Nonce issues
        if (ivIssue) {
          let rule = aesRules.AES002;
          if (ivIssue.issue === 'ZeroIV') {
            TelemetryService.recordCounter('aes.static.iv', 1);
            rule = aesRules.AES003;
          } else if (ivIssue.issue === 'ConstantNonce') {
            TelemetryService.recordCounter('aes.nonce.reuse', 1);
            rule = aesRules.AES017;
          }

          findings.push(
            this.buildAesFinding(rule, {
              algorithm: 'Unknown',
              mode: 'Unknown',
              iv: ivIssue.issue === 'ZeroIV' ? 'Zero' : 'Static',
              language: languageName,
              library: libraryName,
              usageContext,
              api: ivIssue.api,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 95,
              confidence: 95,
              recommendation: ivIssue.description,
              standardsReferences: [...standards, 'RFC 5084']
            })
          );
        }

        // 7. Process weak Randomness sources
        if (randomIssue) {
          TelemetryService.recordCounter('aes.randomness.weak', 1);
          findings.push(
            this.buildAesFinding(aesRules.AES007, {
              algorithm: 'Unknown',
              mode: 'Unknown',
              language: languageName,
              library: libraryName,
              usageContext,
              api: randomIssue.api,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 95,
              confidence: 95,
              recommendation: randomIssue.description,
              standardsReferences: [...standards, 'RFC 4086']
            })
          );
        }

        // 8. Process padding rules
        if (paddingIssue) {
          let rule = aesRules.AES014;
          let pad: AesPadding = 'PKCS7';
          if (paddingIssue.issue === 'InsecurePadding') {
            rule = aesRules.AES015;
            pad = 'Zero';
          }

          findings.push(
            this.buildAesFinding(rule, {
              algorithm: 'Unknown',
              mode: 'Unknown',
              padding: pad,
              language: languageName,
              library: libraryName,
              usageContext,
              api: paddingIssue.api,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 90,
              confidence: 90,
              recommendation: paddingIssue.description,
              standardsReferences: [...standards, 'RFC 8725']
            })
          );
        }

        // 9. Process API usage issues
        if (apiUsageIssue) {
          let rule = aesRules.AES023; // Deprecated Cryptographic API
          findings.push(
            this.buildAesFinding(rule, {
              algorithm: 'Unknown',
              mode: 'Unknown',
              language: languageName,
              library: libraryName,
              usageContext,
              api: apiUsageIssue.api,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 95,
              confidence: 95,
              recommendation: apiUsageIssue.description,
              standardsReferences: [...standards, 'NIST SP 800-131A']
            })
          );
        }

        // 10. Process best practices configurations
        if (bestPractice) {
          findings.push(
            this.buildAesFinding(aesRules.AESB001, {
              algorithm: 'AES-256',
              mode: 'GCM',
              language: languageName,
              library: libraryName,
              usageContext,
              api: bestPractice.practice,
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              detectorVersion: this.version,
              evidenceQuality: 80,
              confidence: 90,
              recommendation: bestPractice.description,
              standardsReferences: [...standards, 'RFC 8725']
            })
          );
        }
      });

      const duration = performance.now() - start;
      TelemetryService.recordHistogram('aes.runtime.ms', duration);

      // Capped Findings budget to prevent generation floods
      if (findings.length > 50) {
        return findings.slice(0, 50);
      }
    }

    return this.deduplicateFindings(findings);
  }

  private buildAesFinding(rule: Rule, evidence: AesEvidence): ScanFinding {
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
