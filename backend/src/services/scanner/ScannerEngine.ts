import { CryptoDetector, ScanContext, ScanResultData, ScanFinding, TargetType } from './types';
import { RiskEngine } from './RiskEngine';
import crypto from 'crypto';

export class ScannerEngine {
  private detectors: Map<string, CryptoDetector> = new Map();
  private riskEngine: RiskEngine = new RiskEngine();

  public registerDetector(detector: CryptoDetector) {
    if (this.detectors.has(detector.id)) {
      throw new Error(`ScannerEngine: Detector with ID '${detector.id}' is already registered.`);
    }
    this.detectors.set(detector.id, detector);
  }

  public async runScan(context: ScanContext): Promise<ScanResultData> {
    const allFindings: ScanFinding[] = [];

    // Filter detectors that support the target type
    const activeDetectors = Array.from(this.detectors.values()).filter(d => 
      d.supportedTargets.includes(context.targetType)
    );

    // Run detectors in parallel
    const scanPromises = activeDetectors.map(async (detector) => {
      try {
        const findings = await detector.scan(context);
        return findings;
      } catch (error) {
        console.error(`ScannerEngine: Detector '${detector.id}' failed during scan:`, error);
        return [];
      }
    });

    const results = await Promise.all(scanPromises);
    results.forEach(findings => allFindings.push(...findings));

    // Calculate risk
    const riskData = this.riskEngine.calculateRisk(allFindings);

    return {
      findings: allFindings,
      ...riskData
    };
  }

  // Support for massive repositories via iterative file reading
  public async runEnterpriseScan(fileIterator: AsyncIterableIterator<string>, baseTargetType: TargetType): Promise<ScanResultData> {
    const allFindings: ScanFinding[] = [];
    const fs = await import('fs/promises');

    // Run detectors sequentially on each file to prevent OOM
    for await (const filePath of fileIterator) {
      try {
        // Only read files up to 5MB to prevent memory bloat on massive binaries
        const stat = await fs.stat(filePath);
        if (stat.size > 5 * 1024 * 1024) continue; 
        
        const content = await fs.readFile(filePath, 'utf-8');
        
        const context: ScanContext = {
          targetType: 'code',
          target: content,
          fileName: filePath,
          language: this.inferLanguage(filePath)
        };

        const activeDetectors = Array.from(this.detectors.values()).filter(d => 
          d.supportedTargets.includes('code')
        );

        for (const detector of activeDetectors) {
           const findings = await detector.scan(context);
           allFindings.push(...findings);
        }
      } catch (err) {
        console.warn(`ScannerEngine: Failed to scan file ${filePath}`, err);
      }
    }

    const riskData = this.riskEngine.calculateRisk(allFindings);

    return {
      findings: allFindings,
      ...riskData
    };
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
