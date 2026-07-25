export interface RulePackMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly author: string;
  readonly description: string;
  readonly rules: readonly string[];
  readonly dependencies: readonly string[];
  readonly minimumEngineVersion: string;
}
