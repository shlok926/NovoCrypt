export interface SeverityOverride {
  readonly ruleId: string;
  readonly severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
}
