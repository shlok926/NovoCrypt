import { RegressionRisk } from '../models/RegressionRisk';

export class RegressionAnalyzer {
  public static estimateRisk(original: string, replacement: string): RegressionRisk {
    if (replacement.includes('helmet') || replacement.includes('ValidationPipe')) {
      return { score: 40, label: 'Medium' };
    }
    return { score: 10, label: 'Low' };
  }
}
