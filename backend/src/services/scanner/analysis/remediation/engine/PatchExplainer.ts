import { SecurePatch } from '../models/SecurePatch';

export class PatchExplainer {
  public static explain(patch: SecurePatch): string {
    return `${patch.explanation}. Replaced: '${patch.originalCode.trim()}' with safe: '${patch.replacementCode.trim()}'`;
  }
}
