import { SecurePatch } from '../models/SecurePatch';
import { FixPatternRegistry } from '../registry/FixPatternRegistry';

export class PatchGenerator {
  private registry = new FixPatternRegistry();

  public generatePatch(patternId: string, originalCode: string): SecurePatch | undefined {
    const pattern = this.registry.getPattern(patternId);
    if (pattern) {
      const replacement = originalCode.replace(pattern.templateBefore, pattern.templateAfter);
      return {
        patchId: patternId,
        originalCode,
        replacementCode: replacement,
        explanation: `Parameterized query implementation resolving ${pattern.category}`,
        frameworkCompatibility: ['generic']
      };
    }
    return undefined;
  }
}
