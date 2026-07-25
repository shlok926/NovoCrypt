import { performance } from 'perf_hooks';
import { Workspace } from './workspace/Workspace';
import { RepositoryScanner } from './discovery/RepositoryScanner';
import { RepositoryAnalyzer } from './analysis/RepositoryAnalyzer';
import { RepositoryConfiguration } from './RepositoryConfiguration';
import { RepositoryReport } from './report/RepositoryReport';
import { RepositoryMetrics } from './report/RepositoryMetrics';
import { IncrementalScanner } from './analysis/IncrementalScanner';
import { WorkspaceCache } from './cache/WorkspaceCache';
import { RepositoryEvents } from './events/RepositoryEvents';

export class RepositoryEngine {
  private scanner = new RepositoryScanner();
  private analyzer = new RepositoryAnalyzer();
  private workspaceCache = new WorkspaceCache();
  private activeWorkspace?: Workspace;
  private currentFindings: any[] = [];
  private lastMetrics?: RepositoryMetrics;

  constructor(private config: RepositoryConfiguration = {}) {}

  public getScanner(): RepositoryScanner {
    return this.scanner;
  }

  public getAnalyzer(): RepositoryAnalyzer {
    return this.analyzer;
  }

  public async scanRepository(rootPath: string): Promise<RepositoryReport> {
    RepositoryEvents.emit('ScanStarted', { rootPath });
    const start = performance.now();

    this.activeWorkspace = this.scanner.scan(rootPath, [], this.config);
    RepositoryEvents.emit('RepositoryLoaded', { workspace: this.activeWorkspace });

    const result = await this.analyzer.analyze(this.activeWorkspace, this.config);
    this.currentFindings = result.findings;

    // Attach dependencyGraph to activeWorkspace for incremental lookup later
    (this.activeWorkspace as any).dependencyGraph = result.dependencyGraph;

    const ruleStats: Record<string, number> = {};
    for (const f of result.findings) {
      ruleStats[f.ruleId] = (ruleStats[f.ruleId] || 0) + 1;
    }

    const elapsed = performance.now() - start;

    const metrics: RepositoryMetrics = {
      filesScanned: this.activeWorkspace.discoveredFiles.length,
      filesSkipped: 0,
      cacheHits: result.metrics.cacheHits,
      cacheMisses: result.metrics.cacheMisses,
      languages: this.activeWorkspace.languageStatistics,
      frameworks: this.activeWorkspace.detectedFrameworks,
      findingsCount: result.findings.length,
      scanDurationMs: elapsed,
      incrementalUpdatesCount: 0,
      workerUtilization: this.config.workerCount || 4,
      parsingTimeMs: result.metrics.timeParsing,
      semanticTimeMs: result.metrics.timeSemantic,
      taintTimeMs: 0,
      frameworkTimeMs: 0,
      policyTimeMs: 0,
      reportGenerationTimeMs: 0
    };
    this.lastMetrics = metrics;

    const report: RepositoryReport = {
      workspaceSummary: {
        root: this.activeWorkspace.root,
        totalFiles: this.activeWorkspace.discoveredFiles.length
      },
      languageStatistics: this.activeWorkspace.languageStatistics,
      frameworkSummary: this.activeWorkspace.detectedFrameworks,
      findings: this.currentFindings,
      ruleStatistics: ruleStats,
      metrics
    };

    RepositoryEvents.emit('ScanCompleted', { report });
    return report;
  }

  public async scanIncremental(changedFiles: readonly string[]): Promise<RepositoryReport> {
    if (!this.activeWorkspace) {
      throw new Error('No active workspace loaded. Scan repository first.');
    }
    RepositoryEvents.emit('ScanStarted', { changedFiles });
    const start = performance.now();

    const cache = this.analyzer.getPipeline().getCache();
    const dependencyGraph = (this.activeWorkspace as any).dependencyGraph;
    IncrementalScanner.invalidateAffected(changedFiles, dependencyGraph, cache);

    const result = await this.analyzer.analyze(this.activeWorkspace, this.config);
    this.currentFindings = result.findings;

    const ruleStats: Record<string, number> = {};
    for (const f of result.findings) {
      ruleStats[f.ruleId] = (ruleStats[f.ruleId] || 0) + 1;
    }

    const elapsed = performance.now() - start;

    const metrics: RepositoryMetrics = {
      filesScanned: this.activeWorkspace.discoveredFiles.length,
      filesSkipped: result.metrics.cacheHits,
      cacheHits: result.metrics.cacheHits,
      cacheMisses: result.metrics.cacheMisses,
      languages: this.activeWorkspace.languageStatistics,
      frameworks: this.activeWorkspace.detectedFrameworks,
      findingsCount: result.findings.length,
      scanDurationMs: elapsed,
      incrementalUpdatesCount: changedFiles.length,
      workerUtilization: this.config.workerCount || 4,
      parsingTimeMs: result.metrics.timeParsing,
      semanticTimeMs: result.metrics.timeSemantic,
      taintTimeMs: 0,
      frameworkTimeMs: 0,
      policyTimeMs: 0,
      reportGenerationTimeMs: 0
    };
    this.lastMetrics = metrics;

    const report: RepositoryReport = {
      workspaceSummary: {
        root: this.activeWorkspace.root,
        totalFiles: this.activeWorkspace.discoveredFiles.length
      },
      languageStatistics: this.activeWorkspace.languageStatistics,
      frameworkSummary: this.activeWorkspace.detectedFrameworks,
      findings: this.currentFindings,
      ruleStatistics: ruleStats,
      metrics
    };

    RepositoryEvents.emit('ScanCompleted', { report });
    return report;
  }
}
