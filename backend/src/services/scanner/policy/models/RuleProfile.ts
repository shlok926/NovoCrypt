export interface RuleProfile {
  readonly id: string;
  readonly name: string;
  readonly enabledRules: readonly string[];
  readonly minimumSeverity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  readonly confidenceThreshold: number;
  readonly executionMode: 'fast' | 'deep' | 'governed';
}
