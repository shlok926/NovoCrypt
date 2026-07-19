import { CryptoDetector, ScanContext, ScanFinding, TargetType, DetectorMetadata, Rule, Evidence } from '../types';
import { RuleEngine } from '../RuleEngine';

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

export class RsaDetector implements CryptoDetector {
  id = 'detector-rsa';
  name = 'RSA Key & Implementation Detector';
  metadata: DetectorMetadata = {
    version: '1.0.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v1',
    category: 'Asymmetric Cryptography',
    documentationUrl: 'https://docs.novocrypt.app/detectors/rsa',
  };
  supportedTargets: TargetType[] = ['code', 'config'];
  private ruleEngine = new RuleEngine();

  async scan(context: ScanContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    if (context.targetType === 'code' && typeof context.target === 'string') {
      const lines = context.target.split('\n');
      
      lines.forEach((line, index) => {
        // Simulated AST Node Match: Looking for RSA key generation or usage
        if (line.includes('RSA') && line.includes('2048')) {
          const evidence: Evidence = {
            file: context.fileName,
            line: index + 1,
            snippet: line.trim(),
            matchedPattern: 'RSA.*2048',
            language: context.language,
          };
          
          findings.push(this.ruleEngine.createFinding(
            this.id,
            rsa2048Rule,
            evidence,
            70 // 70% confidence for regex-based match
          ));
        }
      });
    }

    return findings;
  }
}
