import { CryptoDetector, ScanContext, ScanResultData, ScanFinding, TargetType } from './types';
import { RiskEngine } from './RiskEngine';
import { detectorRegistry } from './framework/DetectorRegistry';
import { Logger, TelemetryService } from '../observability';

export class ScannerEngine {
  private riskEngine: RiskEngine = new RiskEngine();

  // Keep for backwards compatibility if needed, but proxy to registry
  public registerDetector(detector: CryptoDetector) {
    detectorRegistry.register(detector);
  }

  public async runScan(context: ScanContext, traceId?: string): Promise<ScanResultData> {
    const allFindings: ScanFinding[] = [];
    const logger = new Logger({ traceId, component: 'ScannerEngine', targetType: context.targetType });
    const engineStart = performance.now();

    logger.info('Starting legacy runScan');

    // Filter detectors that support the target type
    const activeDetectors = detectorRegistry.getActiveDetectors(context.targetType);

    // Run detectors in parallel with performance profiling
    const scanPromises = activeDetectors.map(async (detector) => {
      try {
        const start = performance.now();
        const findings = await detector.detect(context);
        const duration = performance.now() - start;
        
        TelemetryService.recordHistogram(`detector.runtime.ms`, duration, { detectorId: detector.id });
        if (duration > 1000) logger.warn(`Detector ${detector.id} took ${duration.toFixed(2)}ms`, { file: context.fileName });
        
        return findings;
      } catch (error) {
        logger.error(`Detector '${detector.id}' failed during scan`, error, { detectorId: detector.id });
        TelemetryService.recordCounter('detector.failure', 1, { detectorId: detector.id });
        return [];
      }
    });

    const results = await Promise.all(scanPromises);
    results.forEach(findings => allFindings.push(...findings));

    // Deduplicate findings
    const deduplicatedFindings = this.deduplicateFindings(allFindings);
    
    // Calculate risk
    const riskData = this.riskEngine.calculateRisk(deduplicatedFindings);

    const totalDuration = performance.now() - engineStart;
    TelemetryService.recordHistogram('scan.total.duration.ms', totalDuration, { targetType: context.targetType });
    TelemetryService.recordCounter('scan.findings.total', deduplicatedFindings.length);

    logger.info('Legacy runScan completed', { durationMs: totalDuration, findingCount: deduplicatedFindings.length });

    return {
      findings: deduplicatedFindings,
      ...riskData
    };
  }

  // Support for massive repositories via iterative file reading
  public async runEnterpriseScan(fileIterator: AsyncIterableIterator<string>, baseTargetType: TargetType, traceId?: string): Promise<ScanResultData> {
    const allFindings: ScanFinding[] = [];
    const fs = await import('fs/promises');
    const logger = new Logger({ traceId, component: 'ScannerEngine', targetType: baseTargetType });
    const engineStart = performance.now();

    logger.info('Starting runEnterpriseScan');
    let filesScanned = 0;

    // Run detectors sequentially on each file to prevent OOM
    for await (const filePath of fileIterator) {
      try {
        // Only read files up to 5MB to prevent memory bloat on massive binaries
        const stat = await fs.stat(filePath);
        if (stat.size > 5 * 1024 * 1024) continue; 
        
        const content = await fs.readFile(filePath, 'utf-8');
        filesScanned++;
        
        const context: ScanContext = {
          targetType: 'code',
          target: content,
          fileName: filePath,
          language: this.inferLanguage(filePath)
        };

        const activeDetectors = detectorRegistry.getActiveDetectors('code');

        for (const detector of activeDetectors) {
           const start = performance.now();
           const findings = await detector.detect(context);
           const duration = performance.now() - start;
           
           TelemetryService.recordHistogram('detector.runtime.ms', duration, { detectorId: detector.id });
           
           if (duration > 500) logger.warn(`Detector ${detector.id} took ${duration.toFixed(2)}ms`, { file: filePath });
           allFindings.push(...findings);
        }
      } catch (err) {
        logger.error(`Failed to scan file ${filePath}`, err);
        TelemetryService.recordCounter('scan.file.failure', 1);
      }
    }

    const deduplicatedFindings = this.deduplicateFindings(allFindings);
    const riskData = this.riskEngine.calculateRisk(deduplicatedFindings);

    const totalDuration = performance.now() - engineStart;
    TelemetryService.recordHistogram('scan.enterprise.total.duration.ms', totalDuration, { targetType: baseTargetType });
    TelemetryService.recordCounter('scan.enterprise.files.scanned', filesScanned);
    TelemetryService.recordCounter('scan.enterprise.findings.total', deduplicatedFindings.length);

    logger.info('runEnterpriseScan completed', { durationMs: totalDuration, filesScanned, findingCount: deduplicatedFindings.length });

    return {
      findings: deduplicatedFindings,
      ...riskData
    };
  }

  /**
   * Identifies and suppresses duplicate findings on the same line for the same rule.
   */
  private deduplicateFindings(findings: ScanFinding[]): ScanFinding[] {
    const unique = new Map<string, ScanFinding>();
    for (const f of findings) {
      // Hash key: ruleId + file + line (fallback to snippet if line missing)
      const key = `${f.ruleId}-${f.evidence.file || 'unknown'}-${f.evidence.line || f.evidence.snippet}`;
      if (!unique.has(key)) {
        unique.set(key, f);
      } else {
        // Keep the one with the highest confidence
        const existing = unique.get(key)!;
        if (f.confidence > existing.confidence) {
          unique.set(key, f);
        }
      }
    }
    return Array.from(unique.values());
  }

  private inferLanguage(filePath: string): string {
    if (filePath.endsWith('.js') || filePath.endsWith('.ts')) return 'javascript';
    if (filePath.endsWith('.py')) return 'python';
    if (filePath.endsWith('.java')) return 'java';
    if (filePath.endsWith('.go')) return 'go';
    if (filePath.endsWith('.cs')) return 'csharp';
    return 'unknown';
  }
}

export const scannerEngine = new ScannerEngine();
