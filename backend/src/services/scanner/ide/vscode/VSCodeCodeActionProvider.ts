import { DiagnosticModel, CodeAction } from '../core/DiagnosticModel';

export class VSCodeCodeActionProvider {
  public getCodeActions(diagnostic: DiagnosticModel): CodeAction[] {
    return [
      {
        title: `Remediate: ${diagnostic.suggestedRemediation}`,
        kind: 'quickfix',
        command: 'novocrypt.applyRemediation',
        arguments: [diagnostic.file, diagnostic.fingerprint]
      }
    ];
  }
}
