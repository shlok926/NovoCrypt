import { PatchCandidate } from '../models/PatchCandidate';

export class PatchRanker {
  public static rank(candidates: PatchCandidate[]): PatchCandidate[] {
    return [...candidates].sort((a, b) => b.priority - a.priority);
  }
}
