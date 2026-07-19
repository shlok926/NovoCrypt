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
      const lines = context.target.split('\n'); // TODO: Replace with read stream for massive files to prevent OOM
      
      // Production-grade heuristics targeting explicit cryptography API usage
      const md5Regex = /(crypto\.createHash\(['"`]md5['"`]\)|MessageDigest\.getInstance\(['"`]MD5['"`]\)|hashlib\.md5\(|System\.Security\.Cryptography\.MD5\.Create\(\))/i;
      const sha1Regex = /(crypto\.createHash\(['"`]sha1['"`]\)|MessageDigest\.getInstance\(['"`]SHA-1['"`]\)|hashlib\.sha1\(|System\.Security\.Cryptography\.SHA1\.Create\(\))/i;

      lines.forEach((line, index) => {
        if (md5Regex.test(line)) {
          const evidence: Evidence = {
            file: context.fileName,
            line: index + 1,
            snippet: line.trim().substring(0, 200), // Prevent massive log lines
            matchedPattern: 'Explicit MD5 API Invocation',
            language: context.language,
          };
          
          findings.push(this.ruleEngine.createFinding(
            this.id,
            md5Rule,
            evidence,
            95 // High confidence due to API boundary match
          ));
        }

        if (sha1Regex.test(line)) {
          const evidence: Evidence = {
            file: context.fileName,
            line: index + 1,
            snippet: line.trim().substring(0, 200),
            matchedPattern: 'Explicit SHA-1 API Invocation',
            language: context.language,
          };

          findings.push(this.ruleEngine.createFinding(
            this.id,
            sha1Rule,
            evidence,
            95
          ));
        }
      });
    }

    return findings;
  }
}
