import { performance } from 'perf_hooks';
import { RemediationConfiguration } from './RemediationConfiguration';
import { RemediationMetrics } from './report/RemediationMetrics';
import { RemediationSummary } from './models/RemediationSummary';
import { RemediationPlan } from './models/RemediationPlan';
import { SecurePatch } from './models/SecurePatch';
import { SecureAlternative } from './models/SecureAlternative';
import { RegressionRisk } from './models/RegressionRisk';
import { PatchConfidence } from './models/PatchConfidence';
import { PatchCache } from './cache/PatchCache';
import { RemediationCache } from './cache/RemediationCache';
import { PatchGenerator } from './engine/PatchGenerator';
import { FrameworkFixGenerator } from './engine/FrameworkFixGenerator';
import { SecureApiRecommender } from './engine/SecureApiRecommender';
import { ValidationAnalyzer } from './engine/ValidationAnalyzer';
import { RegressionAnalyzer } from './engine/RegressionAnalyzer';
import { RemediationEngine } from './engine/RemediationEngine';

export class RemediationOrchestrator {
  private patchCache = new PatchCache();
  private planCache = new RemediationCache();
  private generator = new PatchGenerator();
  private frameworkGenerator = new FrameworkFixGenerator();
  private recommender = new SecureApiRecommender();

  constructor(private config: RemediationConfiguration = {}) {}

  public getPatchCache(): PatchCache {
    return this.patchCache;
  }

  public getPlanCache(): RemediationCache {
    return this.planCache;
  }

  public generateSecurePatches(patternId: string, originalCode: string): SecurePatch[] {
    const key = `${patternId}:${originalCode}`;
    const cached = this.patchCache.get(key);
    if (cached) return [cached];

    const patches: SecurePatch[] = [];
    const gen = this.generator.generatePatch(patternId, originalCode);
    if (gen) {
      patches.push(gen);
      this.patchCache.set(key, gen);
    }

    const frameGen = this.frameworkGenerator.generateFix(patternId, originalCode);
    if (frameGen) {
      patches.push(frameGen);
    }

    return patches;
  }

  public recommendSecureApis(name: string): SecureAlternative[] {
    const alt = this.recommender.getAlternative(name);
    return alt ? [alt] : [];
  }

  public validateGeneratedPatches(patch: SecurePatch): PatchConfidence[] {
    const valid = ValidationAnalyzer.validate(patch.replacementCode);
    const score = valid ? 90 : 30;
    return [
      {
        score,
        label: score >= 80 ? 'High' : 'Medium',
        contributors: ['compilation checks verified']
      }
    ];
  }

  public analyseRegressionRisk(original: string, replacement: string): RegressionRisk[] {
    return [RegressionAnalyzer.estimateRisk(original, replacement)];
  }

  public async generateRemediationPlan(
    patternId: string,
    originalCode: string
  ): Promise<{ summary: RemediationSummary; metrics: RemediationMetrics }> {
    const start = performance.now();

    const patches = this.generateSecurePatches(patternId, originalCode);
    const plans: RemediationPlan[] = [];

    patches.forEach((patch, idx) => {
      const plan = RemediationEngine.createPlan(
        `plan-${idx}`,
        { strategy: 'parameterizeQuery', description: 'Parameterize inputs' },
        patch
      );
      plans.push(plan);
      this.planCache.set(plan.planId, plan);
    });

    const averageConfidenceScore = plans.reduce((acc, p) => acc + p.confidence.score, 0) / (plans.length || 1);
    const highestRiskCount = plans.filter(p => p.regressionRisk.label === 'High').length;

    const elapsed = performance.now() - start;

    const summary: RemediationSummary = {
      plans,
      averageConfidenceScore,
      highestRiskCount
    };

    const metrics: RemediationMetrics = {
      remediationPlansGenerated: plans.length,
      securePatchesGenerated: patches.length,
      patchValidationSuccessRate: plans.filter(p => p.confidence.score >= 80).length / (plans.length || 1),
      frameworkAwareFixesGenerated: patches.filter(p => p.frameworkCompatibility.length > 0 && p.frameworkCompatibility[0] !== 'generic').length,
      secureApiRecommendations: 1,
      regressionAnalysesPerformed: patches.length,
      behaviourPreservationChecks: patches.length,
      patchConflictsDetected: 0,
      dependencyChainsResolved: 0,
      remediationCacheHits: this.planCache.size(),
      executionTimeMs: elapsed
    };

    return {
      summary,
      metrics
    };
  }
}
