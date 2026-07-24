import { DiagnosticModel } from '../core/DiagnosticModel';

export interface JetBrainsProblem {
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
  readonly highlightType: 'GENERIC_ERROR_OR_WARNING' | 'WEAK_WARNING' | 'INFORMATION';
  readonly description: string;
  readonly ruleId: string;
}

export class JetBrainsProblemMapper {
  public static mapToJetBrains(diagnostics: readonly DiagnosticModel[]): JetBrainsProblem[] {
    return diagnostics.map(d => {
      let highlightType: 'GENERIC_ERROR_OR_WARNING' | 'WEAK_WARNING' | 'INFORMATION' = 'WEAK_WARNING';
      if (d.severity === 'error') {
        highlightType = 'GENERIC_ERROR_OR_WARNING';
      } else if (d.severity === 'warning') {
        highlightType = 'WEAK_WARNING';
      } else {
        highlightType = 'INFORMATION';
      }

      return {
        filePath: d.file,
        line: d.startLine,
        column: d.startColumn,
        highlightType,
        description: d.description,
        ruleId: d.ruleId
      };
    });
  }
}
