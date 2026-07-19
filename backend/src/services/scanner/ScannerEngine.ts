import { CryptoDetector, ScanContext, ScanResultData, ScanFinding } from './types';
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
}

export const scannerEngine = new ScannerEngine();
