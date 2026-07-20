import { ScanContext, ScanFinding, TargetType, DetectorMetadata, Evidence, Rule } from '../types';
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
  
  metadata: DetectorMetadata = {
    version: '1.0.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v1',
    category: 'Elliptic Curve Cryptography',
    documentationUrl: 'https://docs.novocrypt.app/detectors/ecc',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions
  };
  supportedTargets: TargetType[] = ['code', 'config'];

  private curveAnalyzer = new CurveAnalyzer();
  private keygenAnalyzer = new KeyGenerationAnalyzer();
  private signatureAnalyzer = new SignatureAnalyzer();
  private keyExchangeAnalyzer = new KeyExchangeAnalyzer();
  private apiUsageAnalyzer = new ApiUsageAnalyzer();
  private migrationAnalyzer = new QuantumMigrationAnalyzer();

  protected async executeDetection(context: ScanContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const sourceFile = context.fileName || 'unknown_file';
    
    if ((context.targetType === 'code' || context.targetType === 'config') && typeof context.target === 'string') {
      const start = performance.now();
      const targetCode = context.target;
      const lines = targetCode.split('\n');
      
      // Analyze file-wide context to allow cross-line correlation
      const hasKeyGen = /KeyPairGenerator|generateKeyPair|ECDsa\.Create|generate_private_key|GenerateKey|libsodium/i.test(targetCode);
      const hasSig = /ECDSA|EdDSA|Ed25519|Ed448|crypto\.sign|crypto\.verify|Signature\.getInstance/i.test(targetCode);
      const hasKx = /ECDH|KeyAgreement|createECDH|X25519|X448/i.test(targetCode);
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) return; // skip comments
        
        // 1. Analyze curve declarations
        const curvesFound = this.curveAnalyzer.analyzeLine(trimmedLine);
        
        // 2. Analyze key generation
        const keygenFound = this.keygenAnalyzer.analyzeLine(trimmedLine);
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
                  securityClassification: 'Weak',
                  language: context.language || 'unknown',
                  api: keygenFound.api,
                  library: keygenFound.library,
                  file: sourceFile,
                  line: lineNum,
                  snippet: trimmedLine.substring(0, 200),
                  detectorVersion: this.version,
                  evidenceQuality: 90,
                  confidence: 95,
                  recommendation: eccRules.ECC005.recommendation
                }
              )
            );
          }
        }
        
        // 3. Analyze signature usage
        const sigFound = this.signatureAnalyzer.analyzeLine(trimmedLine);
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
                  securityClassification: 'Weak',
                  language: context.language || 'unknown',
                  api: sigFound.api,
                  library: sigFound.library,
                  file: sourceFile,
                  line: lineNum,
                  snippet: trimmedLine.substring(0, 200),
                  detectorVersion: this.version,
                  evidenceQuality: 95,
                  confidence: 95,
                  recommendation: eccRules.ECC004.recommendation
                }
              )
            );
          }
        }
        
        // 4. Analyze key exchange usage
        const kxFound = this.keyExchangeAnalyzer.analyzeLine(trimmedLine);
        if (kxFound) {
          TelemetryService.recordCounter('ecc.ecdh.detected', 1);
        }
        
        // 5. Analyze general API misuse
        const apiMisuse = this.apiUsageAnalyzer.analyzeLine(trimmedLine);
        if (apiMisuse) {
          TelemetryService.recordCounter('ecc.api.misuse', 1);
          const rule = apiMisuse.issue === 'CustomCurve' ? eccRules.ECC003 : eccRules.ECC003;
          findings.push(
            this.buildEccFinding(
              rule,
              {
                algorithm: 'ECC API',
                purpose: 'Elliptic Curve Cryptography API Usage',
                securityClassification: 'Weak',
                language: context.language || 'unknown',
                api: apiMisuse.api,
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                detectorVersion: this.version,
                evidenceQuality: 85,
                confidence: 90,
                recommendation: apiMisuse.description
              }
            )
          );
        }
        
        // 6. Cross-reference curve declarations with operations
        if (curvesFound.length > 0) {
          for (const match of curvesFound) {
            const curve = match.curve;
            TelemetryService.recordCounter('ecc.curves.detected', 1);
            
            // Map telemetry based on classification
            if (curve.classification === 'Secure Classical') {
              TelemetryService.recordCounter('ecc.curves.secure', 1);
            } else {
              TelemetryService.recordCounter('ecc.curves.deprecated', 1);
            }
            
            // Determine active rule based on curve classification
            let ruleToApply: Rule | null = null;
            let classification: EccSecurityClassification = curve.classification;
            
            if (curve.classification === 'Weak') {
              ruleToApply = eccRules.ECC001;
            } else if (curve.classification === 'Deprecated') {
              ruleToApply = eccRules.ECC002;
            } else if (curve.classification === 'Secure Classical') {
              // Standard secure modern curves generate quantum migration recommendation ONLY
              if (this.migrationAnalyzer.checkMigrationNeed(curve)) {
                TelemetryService.recordCounter('ecc.quantum.migration', 1);
                ruleToApply = eccRules.ECCM001;
              }
            }
            
            if (ruleToApply) {
              // Determine operation type/purpose based on context
              let purpose = 'Configuration';
              let alg = 'ECC';
              let confidenceScore = 60; // default for curve keyword in text
              let explanation = 'Elliptic curve parameter mentioned in source code';
              let api = 'Namespace Configuration';
              let library: string | undefined = undefined;
              
              if (keygenFound) {
                purpose = 'Key Generation';
                alg = 'ECDSA/ECDH KeyGen';
                confidenceScore = 95;
                explanation = 'Curve parameter verified inside cryptographic key generation context';
                api = keygenFound.api;
                library = keygenFound.library;
              } else if (sigFound) {
                purpose = 'Digital Signature';
                alg = sigFound.isEd25519OrEd448 ? 'EdDSA' : 'ECDSA';
                confidenceScore = 95;
                explanation = 'Curve parameter verified inside digital signature context';
                api = sigFound.api;
                library = sigFound.library;
              } else if (kxFound) {
                purpose = 'Key Agreement';
                alg = 'ECDH';
                confidenceScore = 95;
                explanation = 'Curve parameter verified inside key agreement context';
                api = kxFound.api;
                library = kxFound.library;
              } else if (hasKeyGen) {
                purpose = 'Key Generation';
                alg = 'ECDSA/ECDH KeyGen';
                confidenceScore = 95;
                explanation = 'Curve parameter verified via key generation namespace imports';
                api = 'KeyPairGenerator';
                library = 'Standard Provider';
              } else if (hasSig) {
                purpose = 'Digital Signature';
                alg = 'ECDSA';
                confidenceScore = 95;
                explanation = 'Curve parameter verified via signature namespace imports';
                api = 'Signature API';
                library = 'Standard Provider';
              } else if (hasKx) {
                purpose = 'Key Agreement';
                alg = 'ECDH';
                confidenceScore = 95;
                explanation = 'Curve parameter verified via key agreement namespace imports';
                api = 'Key Agreement API';
                library = 'Standard Provider';
              } else if (trimmedLine.includes('import') || trimmedLine.includes('require') || trimmedLine.includes('using')) {
                confidenceScore = 80;
                explanation = 'Curve imported or referenced via namespace configuration';
              }
              
              findings.push(
                this.buildEccFinding(
                  ruleToApply,
                  {
                    curveName: curve.name,
                    oid: curve.oid,
                    algorithm: alg,
                    purpose: purpose,
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
                    recommendation: ruleToApply.recommendation
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
    
    // Deduplicate findings on same line for same rule to avoid redundant reports
    return this.deduplicateFindings(findings);
  }
  
  private buildEccFinding(rule: Rule, evidence: EccEvidence): ScanFinding {
    // Generate standard base finding
    const standardEvidence: Evidence = {
      file: evidence.file,
      line: evidence.line,
      snippet: evidence.snippet,
      matchedPattern: evidence.api,
      language: evidence.language,
      qualityScore: evidence.evidenceQuality
    };
    
    const finding = this.buildFinding(rule, standardEvidence, evidence.confidence);
    
    // Inject the structured evidence model properties into evidence object
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
