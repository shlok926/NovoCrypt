import { Workspace } from '../workspace/Workspace';
import { LanguageDetector } from './LanguageDetector';

export class WorkspaceLoader {
  public static loadWorkspace(root: string, discoveredFiles: readonly string[]): Workspace {
    const stats: Record<string, number> = {
      typescript: 0,
      tsx: 0,
      javascript: 0,
      jsx: 0
    };

    for (const f of discoveredFiles) {
      const lang = LanguageDetector.detectLanguage(f);
      if (lang !== 'unknown') {
        stats[lang] = (stats[lang] || 0) + 1;
      }
    }

    return {
      root: root.replace(/\\/g, '/'),
      discoveredFiles,
      languageStatistics: stats,
      detectedFrameworks: [],
      metadata: new Map()
    };
  }
}
