import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { PolicyMetrics } from './PolicyMetrics';

export interface PolicyResult {
  readonly findings: readonly FrameworkFinding[];
  readonly suppressed: readonly FrameworkFinding[];
  readonly metrics: PolicyMetrics;
}
