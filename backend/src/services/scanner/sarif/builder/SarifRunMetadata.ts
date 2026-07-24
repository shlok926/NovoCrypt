import { RuleExecutionMetrics } from '../../ast/framework/rules/engine/RuleExecutionMetrics';

export class SarifRunMetadata {
  public readonly toolName = 'NovoCrypt';
  public readonly toolVersion = '2.0.0';
  public readonly informationUri = 'https://github.com/shlok926/novocrypt';

  public buildRunProperties(metrics: RuleExecutionMetrics): Record<string, any> {
    return {
      'novocrypt.scanDurationMs': metrics.executionTimeMs,
      'novocrypt.evaluatedRoutesCount': metrics.evaluatedRoutesCount,
      'novocrypt.findingsCount': metrics.findingsCount,
      'novocrypt.skippedPipelinesCount': metrics.skippedPipelinesCount
    };
  }
}
