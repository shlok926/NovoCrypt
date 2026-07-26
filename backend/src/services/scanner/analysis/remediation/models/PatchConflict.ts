export interface PatchConflict {
  readonly patchIdA: string;
  readonly patchIdB: string;
  readonly hasOverlap: boolean;
  readonly description: string;
}
