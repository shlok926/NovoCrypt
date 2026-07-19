import { CryptoDetector, DetectorMetadata, Rule, ScanContext, ScanFinding, TargetType, Evidence } from '../types';
import { RuleEngine } from '../RuleEngine';

export abstract class BaseDetector implements CryptoDetector {
  public abstract id: string;
  public abstract name: string;
  public abstract metadata: DetectorMetadata;
  public abstract supportedTargets: TargetType[];
  
  protected ruleEngine = new RuleEngine();

  /**
   * The core detection method to be implemented by all concrete detectors.
   */
  protected abstract executeDetection(context: ScanContext): Promise<ScanFinding[]>;

  /**
   * Standardized entrypoint for the ScannerEngine.
   */
  public async detect(context: ScanContext): Promise<ScanFinding[]> {
    try {
      const findings = await this.executeDetection(context);
      return findings;
    } catch (error) {
      console.error(`[Detector Error] ${this.id} failed on target ${context.fileName || 'unknown'}:`, error);
      // Return empty findings to avoid crashing the entire pipeline
      return [];
    }
  }

  /**
   * Helper to standardize confidence scoring.
   */
  protected calculateConfidence(matchType: 'exact_api' | 'regex_heuristic' | 'ast_verified'): number {
    switch (matchType) {
      case 'ast_verified': return 100;
      case 'exact_api': return 95;
      case 'regex_heuristic': return 70;
      default: return 50;
    }
  }

  /**
   * Helper to construct findings safely.
   */
  protected buildFinding(rule: Rule, evidence: Evidence, confidence: number): ScanFinding {
    return this.ruleEngine.createFinding(this.id, rule, evidence, confidence);
  }
}
