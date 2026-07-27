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
import { Workspace } from '../../repository/workspace/Workspace';

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

  /**
   * @deprecated Passing string instead of Workspace will be removed in a future major version. Use Workspace snapshots.
   */
  public generateRecommendations(workspace: Workspace | string): Recommendation[] {
    const vulnerabilityId = typeof workspace === 'string' ? workspace : (workspace.metadata.get('vulnerabilityId') || 'sql_injection');
    const key = `rec-${vulnerabilityId}`;
    const cached = this.recommendationCache.get(key);
    if (cached) return [cached];

    const rec = this.recGen.generate(vulnerabilityId);
    this.recommendationCache.set(key, rec);
    return [rec];
  }

  /**
   * @deprecated Passing string instead of Workspace will be removed in a future major version. Use Workspace snapshots.
   */
  public analyseRootCauses(workspace: Workspace | string, filePath?: string): RootCause[] {
    let vulnerabilityId = 'sql_injection';
    let file = filePath || 'src/db.ts';
    if (typeof workspace !== 'string') {
      vulnerabilityId = workspace.metadata.get('vulnerabilityId') || 'sql_injection';
      file = workspace.metadata.get('filePath') || file;
    } else {
      vulnerabilityId = workspace;
    }
    return [RootCauseAnalyzer.analyze(vulnerabilityId, file)];
  }

  /**
   * @deprecated Passing string[] instead of Workspace will be removed in a future major version. Use Workspace snapshots.
   */
  public compareRemediationStrategies(workspace: Workspace | string[]): FixComparison[] {
    const strategies = Array.isArray(workspace) ? workspace : (workspace.metadata.get('strategies') || ['parameterize']);
    return FixComparator.compare(strategies);
  }

  /**
   * @deprecated Passing string instead of Workspace will be removed in a future major version. Use Workspace snapshots.
   */
  public generateDeveloperGuidance(workspace: Workspace | string): SecurityInsight[] {
    const vulnerabilityId = typeof workspace === 'string' ? workspace : (workspace.metadata.get('vulnerabilityId') || 'sql_injection');
    return DeveloperGuidanceGenerator.generate(vulnerabilityId);
  }

  /**
   * @deprecated Passing string parameters instead of Workspace will be removed in a future major version. Use Workspace snapshots.
   */
  public async generateSecurityExplanations(
    workspace: Workspace | string,
    filePath?: string,
    steps: string[] = []
  ): Promise<{ summary: AdvisorSummary; metrics: AdvisorMetrics }> {
    let vulnerabilityId = 'sql_injection';
    let file = filePath || 'src/db.ts';
    let stepsList = steps;

    if (typeof workspace !== 'string') {
      vulnerabilityId = workspace.metadata.get('vulnerabilityId') || 'sql_injection';
      file = workspace.metadata.get('filePath') || file;
      stepsList = workspace.metadata.get('steps') || stepsList;
    } else {
      vulnerabilityId = workspace;
    }

    const start = performance.now();

    const cachedExp = this.explanationCache.get(vulnerabilityId);
    let explanation: SecurityExplanation;

    if (cachedExp) {
      explanation = cachedExp;
    } else {
      explanation = this.reasoner.reason(vulnerabilityId);
      this.explanationCache.set(vulnerabilityId, explanation);
    }

    const { insights, trace } = this.engine.compileAdvisorSummary(vulnerabilityId, file, stepsList);
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
      evidenceLinksCreated: stepsList.length,
      recommendationsGenerated: recs.length,
      recommendationConflictsDetected: conflicts.length,
      knowledgeReferencesResolved: ref ? 1 : 0,
      developerGuidanceGenerated: insights.length,
      explanationCacheHits: cachedExp ? 1 : 0,
      explanationCacheMisses: cachedExp ? 0 : 1,
      recommendationCacheHits: 0,
      recommendationCacheMisses: 1,
      averageExplanationSize: JSON.stringify(explanation).length,
      averageExplanationGenerationTimeMs: elapsed,
      executionTimeMs: elapsed
    };

    return {
      summary,
      metrics
    };
  }
}
