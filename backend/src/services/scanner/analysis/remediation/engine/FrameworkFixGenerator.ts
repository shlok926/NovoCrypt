import { SecurePatch } from '../models/SecurePatch';
import { FrameworkPatchRegistry } from '../registry/FrameworkPatchRegistry';

export class FrameworkFixGenerator {
  private registry = new FrameworkPatchRegistry();

  public generateFix(patchId: string, originalCode: string): SecurePatch | undefined {
    const patchInfo = this.registry.getPatch(patchId);
    if (patchInfo) {
      const replacement = originalCode.replace(patchInfo.before, patchInfo.after);
      return {
        patchId,
        originalCode,
        replacementCode: replacement,
        explanation: `Apply framework-specific patch for: ${patchInfo.framework}`,
        frameworkCompatibility: [patchInfo.framework]
      };
    }
    return undefined;
  }
}
