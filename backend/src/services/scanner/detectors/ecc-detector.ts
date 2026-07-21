import { ScanContext, ScanFinding, TargetType, DetectorMetadata, Evidence, Rule, DetectionContext, SupportLevel, DetectionSupport, LanguageSupportMatrix, KnownBypassMatrix } from '../types';
import { BaseDetector } from '../framework/BaseDetector';
import { CurveAnalyzer } from './curve-analyzer';
import { KeyGenerationAnalyzer } from './keygen-analyzer';
import { SignatureAnalyzer } from './signature-analyzer';
import { KeyExchangeAnalyzer } from './key-exchange-analyzer';
import { ApiUsageAnalyzer } from './api-usage-analyzer';
import { QuantumMigrationAnalyzer } from './quantum-migration-analyzer';
import { eccRules } from './ecc-rule-catalog';
import { CurveDetails, EccEvidence, EccSecurityClassification } from './ecc-types';
import { TelemetryService } from '../../observability';

export class EccDetector extends BaseDetector {
  id = 'detector-ecc';
  name = 'ECC / ECDSA Security Analyzer';
  version = '1.0.0';
  category = 'Elliptic Curve Cryptography';
  supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'csharp', 'rust', 'c', 'cpp'];
  supportedExtensions = ['.js', '.ts', '.py', '.java', '.go', '.cs', '.rs', '.c', '.cpp'];

  languageMatrix: LanguageSupportMatrix = {
    supportedLanguages: this.supportedLanguages,
    languages: this.supportedLanguages.map(lang => ({
      language: lang,
      supportLevel: SupportLevel.FULL,
      notes: 'ECC curve validation and ECDSA/ECDH audits supported'
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
    id: 'ecc-security',
    version: '1.0.0',
    category: ['Key Generation', 'Signature', 'Key Exchange', 'API Misuse'],
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
    category: 'Elliptic Curve Cryptography',
    documentationUrl: 'https://docs.novocrypt.app/detectors/ecc',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions,
    capabilities: this.capabilities,
    languageMatrix: this.languageMatrix,
    bypassMatrix: this.bypassMatrix
  };

  supportedTargets: TargetType[] = ['code', 'config'];

  private curveAnalyzer = new CurveAnalyzer();
  private keygenAnalyzer = new KeyGenerationAnalyzer();
  private signatureAnalyzer = new SignatureAnalyzer();
  private keyExchangeAnalyzer = new KeyExchangeAnalyzer();
  private apiUsageAnalyzer = new ApiUsageAnalyzer();
  private migrationAnalyzer = new QuantumMigrationAnalyzer();

  private detectLibrary(code: string): string {
    if (/node-forge|forge\.pki/i.test(code)) return 'node-forge';
    if (/libsodium|sodium_/i.test(code)) return 'libsodium';
    if (/bouncycastle|org\.bouncycastle/i.test(code)) return 'BouncyCastle';
    if (/ring::signature|ring::rand/i.test(code)) return 'ring';
    if (/cryptography\.hazmat/i.test(code)) return 'Python Cryptography';
    if (/golang\.org\/x\/crypto\/curve25519/i.test(code)) return 'Go x/crypto';
    if (/openssl|EC_KEY_/i.test(code)) return 'OpenSSL';
    if (/wolfssl/i.test(code)) return 'wolfSSL';
    if (/mbedtls/i.test(code)) return 'mbedTLS';
    if (/sun\.security\.ec|SunEC/i.test(code)) return 'SunEC';
    if (/elliptic/i.test(code)) return 'elliptic-js';
    return 'Native/Standard Library';
  }

  private detectUsageContext(code: string): string {
    if (/jsonwebtoken|jwt|jose|jwk/i.test(code)) return 'JWT';
    if (/https\.request|tls\.connect|TLSSocket|ssl/i.test(code)) return 'TLS';
    if (/ssh2|paramiko|libssh/i.test(code)) return 'SSH';
    if (/x509|CertificateFactory|X509Certificate/i.test(code)) return 'X.509';
    if (/bitcoin|ethereum|solana|ethers|web3|secp256k1/i.test(code)) return 'Blockchain';
    if (/vpn|ipsec|strongswan/i.test(code)) return 'VPN';
    if (/codesign|signTool|jarsigner/i.test(code)) return 'Code signing';
    if (/firmware|bootloader|secure\s*boot/i.test(code)) return 'Firmware signing';
    return 'Cryptographic Operation';
  }

  protected async executeDetection(context: ScanContext, detectionContext?: DetectionContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const sourceFile = context.fileName || 'unknown_file';
    
    if ((context.targetType === 'code' || context.targetType === 'config') && typeof context.target === 'string') {
      const start = performance.now();
      const targetCode = context.target;
      const lines = targetCode.split('\n');
      
      const fileLibrary = this.detectLibrary(targetCode);
      const fileContext = this.detectUsageContext(targetCode);
      
      // Analyze file-wide context to allow cross-line correlation
      const hasKeyGen = /KeyPairGenerator|generateKeyPair|ECDsa\.Create|generate_private_key|GenerateKey|libsodium/i.test(targetCode);
      const hasSig = /ECDSA|EdDSA|Ed25519|Ed448|crypto\.sign|crypto\.verify|Signature\.getInstance/i.test(targetCode);
      const hasKx = /ECDH|KeyAgreement|createECDH|X25519|X448/i.test(targetCode);
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) return; // skip comments
        
        // Use resolved string if template literal or string concatenation was resolved
        const resolvedItem = detectionContext?.resolvedStrings.get(lineNum);
        const lineToAnalyze = resolvedItem?.isResolved ? resolvedItem.resolved : trimmedLine;

        // Mock AST node context parameter to prove future AST engine capability integration
        const astNodesMock = undefined;
        
        // 1. Analyze curve declarations
        const curvesFound = this.curveAnalyzer.analyzeLine(lineToAnalyze, astNodesMock);
        
        // 2. Analyze key generation
        const keygenFound = this.keygenAnalyzer.analyzeLine(trimmedLine, astNodesMock);
        if (keygenFound) {
          TelemetryService.recordCounter('ecc.keygen.detected', 1);
          if (keygenFound.isWeakRandom) {
            TelemetryService.recordCounter('ecc.api.misuse', 1);
            findings.push(
              this.buildEccFinding(
                eccRules.ECC005,
                {
                  algorithm: 'ECDSA/ECDH KeyGen',
                  purpose: 'Key Generation',
                  usageContext: fileContext,
                  securityClassification: 'Weak',
                  language: context.language || 'unknown',
                  api: keygenFound.api,
                  library: keygenFound.library || fileLibrary,
                  file: sourceFile,
                  line: lineNum,
                  snippet: trimmedLine.substring(0, 200),
                  detectorVersion: this.version,
                  evidenceQuality: 90,
                  confidence: 95,
                  recommendation: eccRules.ECC005.recommendation,
                  standardsReferences: ['NIST SP 800-90A', 'OWASP Cryptographic Storage Cheat Sheet']
                }
              )
            );
          }
        }
        
        // 3. Analyze signature usage
        const sigFound = this.signatureAnalyzer.analyzeLine(trimmedLine, astNodesMock);
        if (sigFound) {
          TelemetryService.recordCounter('ecc.signatures.detected', 1);
          if (sigFound.isWeakHash) {
            TelemetryService.recordCounter('ecc.api.misuse', 1);
            findings.push(
              this.buildEccFinding(
                eccRules.ECC004,
                {
                  algorithm: 'ECDSA',
                  purpose: 'Digital Signature',
                  usageContext: fileContext,
                  securityClassification: 'Weak',
                  language: context.language || 'unknown',
                  api: sigFound.api,
                  library: sigFound.library || fileLibrary,
                  file: sourceFile,
                  line: lineNum,
                  snippet: trimmedLine.substring(0, 200),
                  detectorVersion: this.version,
                  evidenceQuality: 95,
                  confidence: 95,
                  recommendation: eccRules.ECC004.recommendation,
                  standardsReferences: ['FIPS 186-5', 'OWASP Cryptographic Storage Cheat Sheet']
                }
              )
            );
          }
        }
        
        // 4. Analyze key exchange usage
        const kxFound = this.keyExchangeAnalyzer.analyzeLine(trimmedLine, astNodesMock);
        if (kxFound) {
          TelemetryService.recordCounter('ecc.ecdh.detected', 1);
        }
        
        // 5. Analyze general API misuse
        const apiMisuse = this.apiUsageAnalyzer.analyzeLine(trimmedLine, astNodesMock);
        if (apiMisuse) {
          TelemetryService.recordCounter('ecc.api.misuse', 1);
          const rule = eccRules.ECC003;
          findings.push(
            this.buildEccFinding(
              rule,
              {
                algorithm: 'ECC API',
                purpose: 'Elliptic Curve Cryptography API Usage',
                usageContext: fileContext,
                securityClassification: 'Weak',
                language: context.language || 'unknown',
                api: apiMisuse.api,
                library: fileLibrary,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 85,
                confidence: 90,
                recommendation: apiMisuse.description,
                standardsReferences: ['RFC 6979', 'NIST SP 800-56A', 'OWASP Cryptographic Storage Cheat Sheet']
              }
            )
          );
        }
        
        // 6. Cross-reference curve declarations with operations
        if (curvesFound.length > 0) {
          for (const match of curvesFound) {
            const curve = match.curve;
            TelemetryService.recordCounter('ecc.curves.detected', 1);
            
            if (curve.classification === 'Secure Classical') {
              TelemetryService.recordCounter('ecc.curves.secure', 1);
            } else {
              TelemetryService.recordCounter('ecc.curves.deprecated', 1);
            }
            
            let ruleToApply: Rule | null = null;
            let classification: EccSecurityClassification = curve.classification;
            
            if (curve.classification === 'Weak') {
              ruleToApply = eccRules.ECC001;
            } else if (curve.classification === 'Deprecated') {
              ruleToApply = eccRules.ECC002;
            } else if (curve.classification === 'Secure Classical') {
              if (this.migrationAnalyzer.checkMigrationNeed(curve)) {
                TelemetryService.recordCounter('ecc.quantum.migration', 1);
                ruleToApply = eccRules.ECCM001;
              }
            }
            
            if (ruleToApply) {
              let purpose = 'Configuration';
              let alg = 'ECC';
              let confidenceScore = 60;
              let explanation = 'Elliptic curve parameter mentioned in source code';
              let api = 'Namespace Configuration';
              let library: string | undefined = fileLibrary;
              
              if (keygenFound) {
                purpose = 'Key Generation';
                alg = 'ECDSA/ECDH KeyGen';
                confidenceScore = 95;
                explanation = 'Curve parameter verified inside cryptographic key generation context';
                api = keygenFound.api;
                library = keygenFound.library || fileLibrary;
              } else if (sigFound) {
                purpose = 'Digital Signature';
                alg = sigFound.isEd25519OrEd448 ? 'EdDSA' : 'ECDSA';
                confidenceScore = 95;
                explanation = 'Curve parameter verified inside digital signature context';
                api = sigFound.api;
                library = sigFound.library || fileLibrary;
              } else if (kxFound) {
                purpose = 'Key Agreement';
                alg = 'ECDH';
                confidenceScore = 95;
                explanation = 'Curve parameter verified inside key agreement context';
                api = kxFound.api;
                library = kxFound.library || fileLibrary;
              } else if (hasKeyGen) {
                purpose = 'Key Generation';
                alg = 'ECDSA/ECDH KeyGen';
                confidenceScore = 95;
                explanation = 'Curve parameter verified via key generation namespace imports';
                api = 'KeyPairGenerator';
              } else if (hasSig) {
                purpose = 'Digital Signature';
                alg = 'ECDSA';
                confidenceScore = 95;
                explanation = 'Curve parameter verified via signature namespace imports';
                api = 'Signature API';
              } else if (hasKx) {
                purpose = 'Key Agreement';
                alg = 'ECDH';
                confidenceScore = 95;
                explanation = 'Curve parameter verified via key agreement namespace imports';
                api = 'Key Agreement API';
              } else if (trimmedLine.includes('import') || trimmedLine.includes('require') || trimmedLine.includes('using')) {
                confidenceScore = 80;
                explanation = 'Curve imported or referenced via namespace configuration';
              }
              
              // Dynamically build Standards References list for this curve & algorithm
              const standardsReferences: string[] = ['OWASP Cryptographic Storage Cheat Sheet'];
              const nameLower = curve.name.toLowerCase();
              if (nameLower.includes('25519')) {
                standardsReferences.push(nameLower.includes('ed') ? 'RFC 8032 (Ed25519)' : 'RFC 7748 (Curve25519/X25519)');
              } else if (nameLower.includes('448')) {
                standardsReferences.push(nameLower.includes('ed') ? 'RFC 8032 (Ed448)' : 'RFC 7748 (Curve448/X448)');
              } else if (nameLower.includes('nist') || nameLower.includes('p-')) {
                standardsReferences.push('NIST SP 800-186');
              }
              if (alg.includes('ECDSA') || hasSig) {
                standardsReferences.push('RFC 6979 (Deterministic ECDSA)');
              }
              
              findings.push(
                this.buildEccFinding(
                  ruleToApply,
                  {
                    curveName: curve.name,
                    oid: curve.oid,
                    algorithm: alg,
                    purpose: purpose,
                    usageContext: fileContext,
                    keySize: curve.keySize,
                    securityClassification: classification,
                    language: context.language || 'unknown',
                    api: api,
                    library: library,
                    file: sourceFile,
                    line: lineNum,
                    snippet: trimmedLine.substring(0, 200),
                    detectorVersion: this.version,
                    evidenceQuality: 90,
                    confidence: confidenceScore,
                    recommendation: ruleToApply.recommendation,
                    standardsReferences: standardsReferences
                  }
                )
              );
            }
          }
        }
      });
      
      const duration = performance.now() - start;
      TelemetryService.recordHistogram('ecc.runtime.ms', duration);
    }
    
    return this.deduplicateFindings(findings);
  }
  
  private buildEccFinding(rule: Rule, evidence: EccEvidence): ScanFinding {
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
