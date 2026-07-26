import { SecurePatch } from '../models/SecurePatch';

export class FixDependencyAnalyzer {
  public static resolveDependencies(patch: SecurePatch): string[] {
    const deps: string[] = [];
    if (patch.replacementCode.includes('helmet')) {
      deps.push('helmet npm package');
    }
    if (patch.replacementCode.includes('DOMPurify')) {
      deps.push('dompurify npm package');
    }
    return deps;
  }
}
