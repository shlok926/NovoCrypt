import * as crypto from 'crypto';
import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { Suppression } from '../models/Suppression';

export class SuppressionEngine {
  public static isSuppressed(finding: FrameworkFinding, suppressions: readonly Suppression[]): { suppressed: boolean; justification?: string } {
    const filename = (finding.executionPipeline.handler.metadata.get('filename') || 'unknown.ts').replace(/\\/g, '/');
    
    // Deterministic fingerprint calculation
    const hashInput = `${finding.ruleId}:${finding.route}:${finding.handler.location.startLine}:${filename}`;
    const fingerprint = crypto.createHash('sha256').update(hashInput).digest('hex');

    const now = Date.now();

    for (const sup of suppressions) {
      // Ignore expired suppressions
      if (sup.expiryTimestamp !== undefined && now > sup.expiryTimestamp) {
        continue;
      }

      // 1. Fingerprint precedence
      if (sup.fingerprint !== undefined && sup.fingerprint === fingerprint) {
        return { suppressed: true, justification: sup.justification };
      }

      // 2. Rule + File precedence
      if (sup.ruleId !== undefined && sup.filePath !== undefined) {
        const normalizedPath = sup.filePath.replace(/\\/g, '/');
        if (finding.ruleId === sup.ruleId && filename === normalizedPath) {
          return { suppressed: true, justification: sup.justification };
        }
      }

      // 3. Directory precedence
      if (sup.directory !== undefined) {
        const normalizedDir = sup.directory.replace(/\\/g, '/');
        if (filename.includes(normalizedDir)) {
          return { suppressed: true, justification: sup.justification };
        }
      }

      // 4. File-only precedence
      if (sup.filePath !== undefined && sup.ruleId === undefined) {
        const normalizedPath = sup.filePath.replace(/\\/g, '/');
        if (filename === normalizedPath) {
          return { suppressed: true, justification: sup.justification };
        }
      }

      // 5. Rule-only precedence
      if (sup.ruleId !== undefined && sup.filePath === undefined && sup.fingerprint === undefined) {
        if (finding.ruleId === sup.ruleId) {
          return { suppressed: true, justification: sup.justification };
        }
      }
    }

    return { suppressed: false };
  }
}
