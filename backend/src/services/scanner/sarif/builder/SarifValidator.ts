import { SarifReport } from '../schema/SarifSchema';

export class SarifValidator {
  public static validate(report: SarifReport): void {
    if (report.version !== '2.1.0') {
      throw new Error("Invalid SARIF version: Must be '2.1.0'");
    }
    if (!report.$schema) {
      throw new Error('SARIF validation error: Missing $schema URI');
    }
    if (!Array.isArray(report.runs)) {
      throw new Error('SARIF validation error: runs must be an array');
    }

    for (const run of report.runs) {
      if (!run.tool?.driver?.name) {
        throw new Error('SARIF validation error: Missing tool driver name');
      }

      const ruleIds = new Set<string>();
      if (run.tool.driver.rules) {
        for (const rule of run.tool.driver.rules) {
          if (!rule.id) {
            throw new Error('SARIF validation error: Rule must contain an id');
          }
          ruleIds.add(rule.id);
        }
      }

      for (const result of run.results) {
        if (!result.ruleId) {
          throw new Error('SARIF validation error: Result must contain a ruleId');
        }
        if (!ruleIds.has(result.ruleId)) {
          throw new Error(`SARIF validation error: Result references unregistered rule ID '${result.ruleId}'`);
        }
        if (!result.message?.text) {
          throw new Error('SARIF validation error: Result must contain message text');
        }
        if (!Array.isArray(result.locations) || result.locations.length === 0) {
          throw new Error('SARIF validation error: Result must contain at least one location');
        }
        for (const loc of result.locations) {
          if (!loc.physicalLocation?.artifactLocation?.uri) {
            throw new Error('SARIF validation error: Physical location must specify artifact URI');
          }
        }
      }
    }
  }
}
