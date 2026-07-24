import { IDEAdapter } from './IDEAdapter';
import { DiagnosticModel } from '../core/DiagnosticModel';
import { DiagnosticDiff } from '../core/DiagnosticDiff';

export class VSCodeAdapter implements IDEAdapter {
  public readonly name = 'VS Code';
  private publishedDiagnostics: DiagnosticModel[] = [];

  public publishDiagnostics(diagnostics: readonly DiagnosticModel[]): void {
    this.publishedDiagnostics = [...diagnostics];
  }

  public clearDiagnostics(): void {
    this.publishedDiagnostics = [];
  }

  public refreshWorkspace(): void {
    // VS Code Workspace refresh logic placeholder
  }

  public updateIncrementally(diff: DiagnosticDiff): void {
    const existingMap = new Map<string, DiagnosticModel>();
    for (const d of this.publishedDiagnostics) {
      existingMap.set(d.fingerprint, d);
    }
    for (const r of diff.removed) {
      existingMap.delete(r.fingerprint);
    }
    for (const u of diff.updated) {
      existingMap.set(u.fingerprint, u);
    }
    for (const a of diff.added) {
      existingMap.set(a.fingerprint, a);
    }
    this.publishedDiagnostics = Array.from(existingMap.values());
  }

  public getPublished(): readonly DiagnosticModel[] {
    return this.publishedDiagnostics;
  }
}
