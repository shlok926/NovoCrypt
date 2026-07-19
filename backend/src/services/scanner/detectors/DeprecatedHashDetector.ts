import { CryptoDetector, ScanContext, ScanFinding, TargetType, DetectorMetadata, Rule, Evidence } from '../types';
import { RuleEngine } from '../RuleEngine';

const md5Rule: Rule = {
  id: 'RULE_HASH_001',
  title: 'Broken Hash Function (MD5) Detected',
  description: 'MD5 is cryptographically broken and highly vulnerable to collision attacks.',
  severity: 'critical',
  algorithm: 'MD5',
  currentRisk: 'Vulnerable to classical collision and preimage attacks.',
  quantumRisk: 'Grover\'s algorithm further reduces preimage resistance.',
  recommendation: 'Replace immediately with SHA-256, SHA-3, or BLAKE3. If used for password hashing, use Argon2id.',
  references: ['RFC 6151']
};

const sha1Rule: Rule = {
  id: 'RULE_HASH_002',
  title: 'Deprecated Hash Function (SHA-1) Detected',
  description: 'SHA-1 is deprecated and vulnerable to chosen-prefix collision attacks.',
  severity: 'high',
  algorithm: 'SHA-1',
  currentRisk: 'Vulnerable to classical collision attacks (e.g. SHAttered).',
  quantumRisk: 'Grover\'s algorithm reduces security to ~80 bits.',
  recommendation: 'Migrate to SHA-256 or SHA-3.',
  references: ['NIST FIPS 180-4']
};

export class DeprecatedHashDetector implements CryptoDetector {
  id = 'detector-hash-deprecated';
  name = 'Deprecated Hash Algorithm Detector';
  metadata: DetectorMetadata = {
    version: '1.0.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v1',
    category: 'Hash Functions',
    documentationUrl: 'https://docs.novocrypt.app/detectors/hash',
  };
  supportedTargets: TargetType[] = ['code', 'config'];
  private ruleEngine = new RuleEngine();

  async scan(context: ScanContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    if (context.targetType === 'code' && typeof context.target === 'string') {
      const lines = context.target.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('MD5') || line.includes('md5')) {
          const evidence: Evidence = {
            file: context.fileName,
            line: index + 1,
            snippet: line.trim(),
            matchedPattern: 'MD5|md5',
            language: context.language,
          };
          
          findings.push(this.ruleEngine.createFinding(
            this.id,
            md5Rule,
            evidence,
            70 // regex match
          ));
        }

        if (line.includes('SHA1') || line.includes('sha1')) {
          const evidence: Evidence = {
            file: context.fileName,
            line: index + 1,
            snippet: line.trim(),
            matchedPattern: 'SHA1|sha1',
            language: context.language,
          };

          findings.push(this.ruleEngine.createFinding(
            this.id,
            sha1Rule,
            evidence,
            70
          ));
        }
      });
    }

    return findings;
  }
}
