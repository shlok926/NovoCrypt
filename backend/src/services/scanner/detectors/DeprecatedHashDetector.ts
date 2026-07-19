import { CryptoDetector, ScanContext, ScanFinding, TargetType } from '../types';
import crypto from 'crypto';

export class DeprecatedHashDetector implements CryptoDetector {
  id = 'detector-hash-deprecated';
  name = 'Deprecated Hash Algorithm Detector';
  supportedTargets: TargetType[] = ['code', 'config'];

  async scan(context: ScanContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    
    // In production, this parses dependency graphs, imports, and AST invocation nodes.
    // Simulating semantic match:
    
    if (context.targetType === 'code' && typeof context.target === 'string') {
      const lines = context.target.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('MD5') || line.includes('md5')) {
          findings.push({
            id: crypto.randomUUID(),
            ruleId: 'HASH-MD5-BROKEN',
            detector: this.name,
            title: 'Broken Hash Function (MD5) Detected',
            description: 'MD5 is cryptographically broken and highly vulnerable to collision attacks.',
            severity: 'critical',
            confidence: 'high',
            evidence: line.trim(),
            file: context.fileName,
            lineNumber: index + 1,
            language: context.language,
            algorithm: 'MD5',
            currentRisk: 'Vulnerable to classical collision and preimage attacks.',
            quantumRisk: 'Grover\'s algorithm further reduces preimage resistance.',
            recommendation: 'Replace immediately with SHA-256, SHA-3, or BLAKE3. If used for password hashing, use Argon2id.',
            references: ['RFC 6151']
          });
        }

        if (line.includes('SHA1') || line.includes('sha1')) {
          findings.push({
            id: crypto.randomUUID(),
            ruleId: 'HASH-SHA1-DEPRECATED',
            detector: this.name,
            title: 'Deprecated Hash Function (SHA-1) Detected',
            description: 'SHA-1 is deprecated and vulnerable to chosen-prefix collision attacks.',
            severity: 'high',
            confidence: 'high',
            evidence: line.trim(),
            file: context.fileName,
            lineNumber: index + 1,
            language: context.language,
            algorithm: 'SHA-1',
            currentRisk: 'Vulnerable to classical collision attacks (e.g. SHAttered).',
            quantumRisk: 'Grover\'s algorithm reduces security to ~80 bits.',
            recommendation: 'Migrate to SHA-256 or SHA-3.',
            references: ['NIST FIPS 180-4']
          });
        }
      });
    }

    return findings;
  }
}
