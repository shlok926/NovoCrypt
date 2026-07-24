import { DiagnosticSeverity } from './DiagnosticSeverity';
import { DiagnosticCategory } from './DiagnosticCategory';

export interface RelatedLocation {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly message?: string;
}

export interface DiagnosticModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly severity: DiagnosticSeverity;
  readonly category: DiagnosticCategory;
  readonly file: string;
  readonly startLine: number;
  readonly startColumn: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly ruleId: string;
  readonly framework: string;
  readonly confidence: number;
  readonly suggestedRemediation: string;
  readonly fingerprint: string;
  readonly source: 'NovoCrypt' | 'SARIF' | 'Imported';
  readonly relatedLocations: readonly RelatedLocation[];
}

export interface CodeAction {
  readonly title: string;
  readonly kind: string;
  readonly command: string;
  readonly arguments?: readonly any[];
}
