import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { SeverityOverride } from '../models/SeverityOverride';

export class SeverityEngine {
  public static applyOverrides(
    finding: FrameworkFinding,
    overrides: readonly SeverityOverride[]
  ): { finding: FrameworkFinding; applied: boolean } {
    const matched = overrides.find(o => o.ruleId === finding.ruleId);
    if (matched) {
      return {
        finding: {
          ...finding,
          severity: matched.severity
        },
        applied: true
      };
    }
    return { finding, applied: false };
  }
}
