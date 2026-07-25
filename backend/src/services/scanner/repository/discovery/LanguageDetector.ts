import * as path from 'path';

export class LanguageDetector {
  public static detectLanguage(filePath: string): 'typescript' | 'tsx' | 'javascript' | 'jsx' | 'unknown' {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts':
        return 'typescript';
      case '.tsx':
        return 'tsx';
      case '.js':
      case '.cjs':
      case '.mjs':
        return 'javascript';
      case '.jsx':
        return 'jsx';
      default:
        return 'unknown';
    }
  }

  public static isSupported(filePath: string): boolean {
    return this.detectLanguage(filePath) !== 'unknown';
  }
}
