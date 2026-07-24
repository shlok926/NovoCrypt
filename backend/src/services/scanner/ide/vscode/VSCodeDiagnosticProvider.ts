import { DiagnosticModel } from '../core/DiagnosticModel';

export interface VSCodeDiagnostic {
  readonly range: {
    readonly start: { readonly line: number; readonly character: number };
    readonly end: { readonly line: number; readonly character: number };
  };
  readonly message: string;
  readonly severity: number;
  readonly source: string;
  readonly code: string;
}

export class VSCodeDiagnosticProvider {
  public static mapToVSCode(diagnostics: readonly DiagnosticModel[]): VSCodeDiagnostic[] {
    return diagnostics.map(d => {
      let severity = 1;
      if (d.severity === 'error') severity = 0;
      else if (d.severity === 'warning') severity = 1;
      else if (d.severity === 'info') severity = 2;
      else if (d.severity === 'hint') severity = 3;

      return {
        range: {
          start: { line: d.startLine - 1, character: d.startColumn - 1 },
          end: { line: d.endLine - 1, character: d.endColumn - 1 }
        },
        message: d.description,
        severity,
        source: d.source,
        code: d.ruleId
      };
    });
  }
}
