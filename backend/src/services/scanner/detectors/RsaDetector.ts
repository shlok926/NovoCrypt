import { ScanContext, ScanFinding, TargetType, DetectorMetadata, Rule, Evidence } from '../types';
import { BaseDetector } from '../framework/BaseDetector';

const rsa2048Rule: Rule = {
  id: 'RULE_RSA_001',
  title: 'Insecure RSA-2048 Usage Detected',
  description: 'RSA-2048 keys provide insufficient security against Shor\'s algorithm on a cryptographically relevant quantum computer (CRQC).',
  severity: 'high',
  algorithm: 'RSA',
  keySize: 2048,
  currentRisk: 'Secure against classical attacks, but deprecated by NIST.',
  quantumRisk: 'Vulnerable to complete break via Shor\'s algorithm.',
  recommendation: 'Migrate to ML-KEM (CRYSTALS-Kyber) for key encapsulation or ML-DSA for signatures. If classical security is required, use hybrid modes or RSA-4096 temporarily.',
  references: ['NIST SP 800-208', 'FIPS 204']
};

export class RsaDetector extends BaseDetector {
  id = 'detector-rsa';
  name = 'RSA Key & Implementation Detector';
  version = '1.1.0';
  category = 'Asymmetric Cryptography';
  supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go'];
  supportedExtensions = ['.js', '.ts', '.py', '.java', '.go'];
  
  metadata: DetectorMetadata = {
    version: '1.1.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v2',
    category: 'Asymmetric Cryptography',
    documentationUrl: 'https://docs.novocrypt.app/detectors/rsa',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions
  };
  supportedTargets: TargetType[] = ['code', 'config'];

  protected async executeDetection(context: ScanContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    if (context.targetType === 'code' && typeof context.target === 'string') {
      const lines = context.target.split('\n');
      
      // Production-grade heuristics targeting RSA key generation in Node.js, Java, Python, Go
      const rsaRegex = /(crypto\.generateKeyPair(?:Sync)?\(['"`]rsa['"`].*?modulusLength:\s*(1024|2048)|KeyPairGenerator\.getInstance\(['"`]RSA['"`]\).*?initialize\((1024|2048)\)|rsa\.generate_private_key\([^)]*key_size=(1024|2048)|rsa\.GenerateKey\([^,]+,\s*(1024|2048)\))/i;

      lines.forEach((line, index) => {
        const match = rsaRegex.exec(line);
        if (match) {
          const evidence: Evidence = {
            file: context.fileName,
            line: index + 1,
            snippet: line.trim().substring(0, 200),
            matchedPattern: 'Explicit RSA (1024/2048) Key Generation',
            language: context.language,
            qualityScore: 90
          };
          
          findings.push(this.buildFinding(
            rsa2048Rule,
            evidence,
            this.calculateConfidence('exact_api')
          ));
        }
      });
    }

    return findings;
  }
}
