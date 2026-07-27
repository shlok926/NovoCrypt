import { performance } from 'perf_hooks';
import { AdvisorConfiguration } from './AdvisorConfiguration';
import { AdvisorMetrics } from './report/AdvisorMetrics';
import { AdvisorSummary } from './models/AdvisorSummary';
import { SecurityExplanation } from './models/SecurityExplanation';
import { Recommendation } from './models/Recommendation';
import { RootCause } from './models/RootCause';
import { FixComparison } from './models/FixComparison';
import { SecurityInsight } from './models/SecurityInsight';
import { ExplanationCache } from './cache/ExplanationCache';
import { RecommendationCache } from './cache/RecommendationCache';
import { SecurityReasoner } from './engine/SecurityReasoner';
import { RootCauseAnalyzer } from './engine/RootCauseAnalyzer';
import { RecommendationGenerator } from './engine/RecommendationGenerator';
import { RecommendationConflictAnalyzer } from './engine/RecommendationConflictAnalyzer';
import { FixComparator } from './engine/FixComparator';
import { KnowledgeResolver } from './engine/KnowledgeResolver';
import { DeveloperGuidanceGenerator } from './engine/DeveloperGuidanceGenerator';
import { AdvisorEngine } from './engine/AdvisorEngine';

export class AdvisorOrchestrator {
  private explanationCache = new ExplanationCache();
  private recommendationCache = new RecommendationCache();
  private reasoner = new SecurityReasoner();
  private recGen = new RecommendationGenerator();
  private resolver = new KnowledgeResolver();
  private engine = new AdvisorEngine();

  constructor(private config: AdvisorConfiguration = {}) {}

  public getExplanationCache(): ExplanationCache {
    return this.explanationCache;
  }

  public getRecommendationCache(): RecommendationCache {
    return this.recommendationCache;
  }

  public generateRecommendations(vulnerabilityId: string): Recommendation[] {
    const key = `rec-${vulnerabilityId}`;
    const cached = this.recommendationCache.get(key);
    if (cached) return [cached];

    const rec = this.recGen.generate(vulnerabilityId);
    this.recommendationCache.set(key, rec);
    return [rec];
  }

  public analyseRootCauses(vulnerabilityId: string, filePath: string): RootCause[] {
    return [RootCauseAnalyzer.analyze(vulnerabilityId, filePath)];
  }

  public compareRemediationStrategies(strategies: string[]): FixComparison[] {
    return FixComparator.compare(strategies);
  }

  public generateDeveloperGuidance(vulnerabilityId: string): SecurityInsight[] {
    return DeveloperGuidanceGenerator.generate(vulnerabilityId);
  }

  public async generateSecurityExplanations(
    vulnerabilityId: string,
    filePath: string,
    steps: string[] = []
  ): Promise<{ summary: AdvisorSummary; metrics: AdvisorMetrics }> {
    const start = performance.now();

    const cachedExp = this.explanationCache.get(vulnerabilityId);
    let explanation: SecurityExplanation;

    if (cachedExp) {
      explanation = cachedExp;
    } else {
      explanation = this.reasoner.reason(vulnerabilityId);
      this.explanationCache.set(vulnerabilityId, explanation);
    }

    const { insights, trace } = this.engine.compileAdvisorSummary(vulnerabilityId, filePath, steps);
    const recs = this.generateRecommendations(vulnerabilityId);
    const conflicts = RecommendationConflictAnalyzer.analyzeConflicts(recs);

    const elapsed = performance.now() - start;

    const summary: AdvisorSummary = {
      explanations: [explanation],
      insights,
      traces: [trace]
    };

    const ref = this.resolver.resolve(vulnerabilityId);

    const metrics: AdvisorMetrics = {
      explanationsGenerated: 1,
      reasoningTracesGenerated: 1,
      evidenceLinksCreated: steps.length,
      recommendationsGenerated: recs.length,
      recommendationConflictsDetected: conflicts.length,
      knowledgeReferencesResolved: ref ? 1 : 0,
      developerGuidanceGenerated: insights.length,
      explanationCacheHits: cachedExp ? 1 : 0,
      explanationCacheMisses: cachedExp ? 0 : 1,
      recommendationCacheHits: 0,
      recommendationCacheMisses: 1,
      averageExplanationGenerationTimeMs: elapsed,
      executionTimeMs: elapsed
    };

    return {
      summary,
      metrics
    };
  }
}
