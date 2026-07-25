import { SeverityOverride } from './SeverityOverride';
import { ComplianceMapping } from './ComplianceMapping';

export interface Policy {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly parentPolicyId?: string;
  readonly enabledRulePacks: readonly string[];
  readonly disabledRules: readonly string[];
  readonly severityOverrides: readonly SeverityOverride[];
  readonly complianceMappings: readonly ComplianceMapping[];
  readonly confidenceThreshold?: number;
  readonly frameworkFilters?: readonly string[];
}
