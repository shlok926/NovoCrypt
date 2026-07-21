import { PathClassification } from '../../types';

export class PathFilter {
  /**
   * Classifies a file path into a PathClassification structure.
   */
  public static classify(filePath?: string): PathClassification {
    if (!filePath) {
      return {
        isProductionFile: true,
        isTestFile: false,
        isGenerated: false,
        isDocumentation: false,
        category: 'unknown'
      };
    }

    const normalized = filePath.replace(/\\/g, '/').toLowerCase();
    const fileName = normalized.split('/').pop() || '';

    // 1. Check Documentation / Template Files
    const isDocExtension = /\.(md|txt|rst)$/i.test(fileName);
    const isDocFile = /^(readme|changelog|license|notice)(\..+)?$/i.test(fileName) || fileName === '.env.example';
    const isDocDir = /(?:^|\/)(docs|documentation|examples|samples|demo)(?:\/|$)/i.test(normalized);

    if (isDocExtension || isDocFile || isDocDir) {
      return {
        isProductionFile: false,
        isTestFile: false,
        isGenerated: false,
        isDocumentation: true,
        category: isDocDir ? 'example' : 'documentation'
      };
    }

    // 2. Check Build / Generated Code
    const isBuildDir = /(?:^|\/)(node_modules|dist|build|coverage|out|\.next|\.nuxt)(?:\/|$)/i.test(normalized);
    if (isBuildDir) {
      return {
        isProductionFile: false,
        isTestFile: false,
        isGenerated: true,
        isDocumentation: false,
        category: 'build'
      };
    }

    // 3. Check Test / Fixtures / Specs / Vendor
    const isTestDir = /(?:^|\/)(test|tests|spec|specs|__tests__|fixtures|vendor)(?:\/|$)/i.test(normalized);
    const isTestFile = /\.(test|spec)\.[a-z0-9]+$/i.test(fileName);

    if (isTestDir || isTestFile) {
      return {
        isProductionFile: false,
        isTestFile: true,
        isGenerated: false,
        isDocumentation: false,
        category: 'test'
      };
    }

    return {
      isProductionFile: true,
      isTestFile: false,
      isGenerated: false,
      isDocumentation: false,
      category: 'production'
    };
  }

  /**
   * Helper check if path should be suppressed in enterprise path filtering mode.
   */
  public static isNonProductionPath(filePath?: string): boolean {
    const classification = this.classify(filePath);
    return !classification.isProductionFile;
  }
}
