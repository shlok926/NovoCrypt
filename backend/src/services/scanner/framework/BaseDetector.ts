import { CryptoDetector, DetectorMetadata, Rule, ScanContext, ScanSharedState, ScanFinding, TargetType, Evidence, DetectorHealth, ConfidenceExplanation, DetectionContext } from '../types';
import { RuleEngine } from '../RuleEngine';
import { DetectionContextBuilder } from '../utils/context/DetectionContextBuilder';
import crypto from 'crypto';

export abstract class BaseDetector implements CryptoDetector {
  private static fallbackSharedState = new ScanSharedState();
  public abstract id: string;
  public abstract name: string;
  public abstract version: string;
  public abstract category: string;
  public abstract supportedLanguages: string[];
  public abstract supportedExtensions: string[];
  public abstract metadata: DetectorMetadata;
  public abstract supportedTargets: TargetType[];
  
  protected ruleEngine = new RuleEngine();
  
  // Health & Performance State
  private errorCount = 0;
  private lastError?: string;
  private totalRuntime = 0;
  private executionCount = 0;

  /**
   * Lifecycle hooks with default no-op implementations.
   */
  public initialize(context: ScanContext): Promise<void> | void {}
  public dispose(context: ScanContext): Promise<void> | void {}
  public onRegister(): Promise<void> | void {}
  public onUnregister(): Promise<void> | void {}

  /**
   * The core detection method to be implemented by all concrete detectors.
   */
  protected abstract executeDetection(context: ScanContext, detectionContext?: DetectionContext): Promise<ScanFinding[]>;

  /**
   * Standardized entrypoint for the ScannerEngine.
   */
  public async detect(context: ScanContext): Promise<ScanFinding[]> {
    const start = performance.now();
    const actualContext = context instanceof ScanContext 
      ? context 
      : new ScanContext({
          ...(context as any),
          sharedState: (context as any).sharedState || BaseDetector.fallbackSharedState
        } as any);

    const detectionContext = DetectionContextBuilder.build(actualContext);
    const filterMode = actualContext.configuration?.pathFiltering?.mode || 'enterprise';

    // In enterprise path filtering mode, suppress findings on documentation/build files
    if (filterMode === 'enterprise' && !detectionContext.pathClassification.isProductionFile) {
      if (detectionContext.pathClassification.category === 'documentation' || detectionContext.pathClassification.category === 'build') {
        return [];
      }
    }

    try {
      const findings = await this.executeDetection(actualContext, detectionContext);

      // In enterprise mode, adjust confidence for test/example files
      if (filterMode === 'enterprise' && detectionContext.pathClassification.isTestFile) {
        findings.forEach(f => {
          f.confidence = Math.max(10, f.confidence - 20);
          if (f.confidenceExplanation) {
            f.confidenceExplanation.reason += ' (Reduced: test/fixture path)';
          }
        });
      }

      this.executionCount++;
      this.totalRuntime += (performance.now() - start);
      
      return findings;
    } catch (error) {
      this.errorCount++;
      this.lastError = error instanceof Error ? error.message : String(error);
      
      console.error(`[Detector Error] ${this.id} failed on target ${actualContext.fileName || 'unknown'}:`, error);
      return [];
    }
  }

  public health(): DetectorHealth {
    return {
      status: this.errorCount > 10 ? 'failed' : (this.errorCount > 0 ? 'degraded' : 'healthy'),
      errorCount: this.errorCount,
      lastError: this.lastError,
      averageRuntimeMs: this.executionCount === 0 ? 0 : (this.totalRuntime / this.executionCount)
    };
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

  protected explainConfidence(confidence: number): ConfidenceExplanation {
    if (confidence >= 95) return { level: 'Critical', reason: 'Exact API or AST verification match' };
    if (confidence >= 80) return { level: 'High', reason: 'High-fidelity regex boundary match' };
    if (confidence >= 60) return { level: 'Medium', reason: 'Partial string or generic configuration match' };
    return { level: 'Low', reason: 'Low-quality heuristic match' };
  }

  /**
   * Helper to construct findings safely in compliance with the standardized model.
   */
  protected buildFinding(rule: Rule, evidence: Evidence, confidence: number): ScanFinding {
    // We bypass ruleEngine.createFinding here to strictly enforce the new schema.
    const fingerprint = crypto.createHash('sha256')
      .update(`${rule.id}-${evidence.file}-${evidence.line}-${evidence.snippet}`)
      .digest('hex');

    return {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      detectorId: this.id,
      detectorVersion: this.version,
      category: this.category,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      confidence,
      confidenceExplanation: this.explainConfidence(confidence),
      evidence,
      algorithm: rule.algorithm,
      keySize: rule.keySize,
      currentRisk: rule.currentRisk,
      quantumRisk: rule.quantumRisk,
      recommendation: rule.recommendation,
      references: rule.references || [],
      fingerprint,
      timestamp: new Date().toISOString()
    };
  }
}
