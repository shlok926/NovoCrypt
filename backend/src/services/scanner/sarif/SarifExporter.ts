import * as fs from 'fs';
import * as path from 'path';
import { FrameworkFinding } from '../ast/framework/rules/models/FrameworkFinding';
import { RuleExecutionMetrics } from '../ast/framework/rules/engine/RuleExecutionMetrics';
import { SarifReport } from './schema/SarifSchema';
import { SarifBuilder, SarifExporterOptions } from './builder/SarifBuilder';
import { SarifValidator } from './builder/SarifValidator';

export class SarifExporter {
  private builder = new SarifBuilder();

  public exportSarif(
    findings: readonly FrameworkFinding[],
    metrics: RuleExecutionMetrics,
    options?: SarifExporterOptions
  ): SarifReport {
    const report = this.builder.buildReport(findings, metrics, options);
    SarifValidator.validate(report);
    return report;
  }

  public writeSarif(
    report: SarifReport,
    outputPath: string,
    options?: SarifExporterOptions
  ): void {
    // Ensure parent directories exist
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const space = options?.prettyPrint ? 2 : undefined;
    const content = JSON.stringify(report, null, space);
    fs.writeFileSync(outputPath, content, 'utf8');
  }
}
export { SarifExporterOptions };
