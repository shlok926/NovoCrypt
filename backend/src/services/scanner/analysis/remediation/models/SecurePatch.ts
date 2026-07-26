export interface SecurePatch {
  readonly patchId: string;
  readonly originalCode: string;
  readonly replacementCode: string;
  readonly explanation: string;
  readonly frameworkCompatibility: readonly string[];
}
