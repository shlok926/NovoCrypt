export interface IDEConfiguration {
  readonly frameworkFilter?: readonly string[];
  readonly ruleFilter?: readonly string[];
  readonly confidenceThreshold?: number;
  readonly severityThreshold?: readonly ('error' | 'warning' | 'info' | 'hint')[];
  readonly ignoredFiles?: readonly string[];
  readonly ignoredDirectories?: readonly string[];
  readonly maxDiagnosticsCount?: number;
  readonly autoRefresh?: boolean;
}

export class IDEConfigurationManager {
  private config: IDEConfiguration = {
    confidenceThreshold: 0,
    maxDiagnosticsCount: 100000,
    autoRefresh: true
  };

  public getConfiguration(): IDEConfiguration {
    return this.config;
  }

  public updateConfiguration(newConfig: IDEConfiguration): void {
    this.config = { ...this.config, ...newConfig };
  }

  public shouldInclude(diag: {
    readonly framework: string;
    readonly ruleId: string;
    readonly confidence: number;
    readonly severity: 'error' | 'warning' | 'info' | 'hint';
    readonly file: string;
  }): boolean {
    const config = this.config;

    // Framework filter
    if (config.frameworkFilter && config.frameworkFilter.length > 0) {
      if (!config.frameworkFilter.includes(diag.framework)) return false;
    }

    // Rule filter
    if (config.ruleFilter && config.ruleFilter.length > 0) {
      if (!config.ruleFilter.includes(diag.ruleId)) return false;
    }

    // Confidence threshold
    if (config.confidenceThreshold !== undefined) {
      if (diag.confidence < config.confidenceThreshold) return false;
    }

    // Severity threshold
    if (config.severityThreshold && config.severityThreshold.length > 0) {
      if (!config.severityThreshold.includes(diag.severity)) return false;
    }

    // Ignored files
    if (config.ignoredFiles && config.ignoredFiles.length > 0) {
      if (config.ignoredFiles.some(f => diag.file.includes(f))) return false;
    }

    // Ignored directories
    if (config.ignoredDirectories && config.ignoredDirectories.length > 0) {
      if (config.ignoredDirectories.some(d => diag.file.split('/').includes(d))) return false;
    }

    return true;
  }
}
