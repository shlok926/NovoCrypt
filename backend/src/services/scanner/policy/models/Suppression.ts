export interface Suppression {
  readonly id: string;
  readonly ruleId?: string;
  readonly fingerprint?: string;
  readonly filePath?: string;
  readonly directory?: string;
  readonly expiryTimestamp?: number;
  readonly justification: string;
}
