import { DetectionContext, ScanContext, SupportLevel } from '../../types';
import { PathFilter } from '../filtering/pathFilter';
import { StringResolver } from '../resolver/stringResolver';

export class DetectionContextBuilder {
  /**
   * Constructs a unified DetectionContext encapsulating path classification,
   * language metadata, and resolved string maps.
   */
  public static build(scanContext: ScanContext): DetectionContext {
    const targetCode = typeof scanContext.target === 'string' ? scanContext.target : '';
    const pathClassification = PathFilter.classify(scanContext.fileName);
    const resolvedStrings = StringResolver.resolveAll(targetCode);
    const language = scanContext.language || 'unknown';

    return {
      scanContext,
      pathClassification,
      resolvedStrings,
      language,
      languageSupport: {
        language,
        supportLevel: SupportLevel.FULL,
        notes: 'Static analysis and string resolution active'
      }
    };
  }
}
