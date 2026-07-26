import { LifecycleStage } from '../models/LifecycleStage';

export class LifecycleAnalyzer {
  public static analyzeStages(stages: LifecycleStage[]): string[] {
    return stages.map(s => s.stageName);
  }
}
