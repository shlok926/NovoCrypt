import { SecurePatch } from './SecurePatch';

export interface PatchCandidate {
  readonly candidateId: string;
  readonly patch: SecurePatch;
  readonly priority: number;
}
