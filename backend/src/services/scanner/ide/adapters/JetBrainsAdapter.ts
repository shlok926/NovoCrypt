import { IDEAdapter } from './IDEAdapter';
import { DiagnosticModel } from '../core/DiagnosticModel';
import { DiagnosticDiff } from '../core/DiagnosticDiff';

export class JetBrainsAdapter implements IDEAdapter {
  public readonly name = 'JetBrains';
  private publishedProblems: DiagnosticModel[] = [];

  public publishDiagnostics(diagnostics: readonly DiagnosticModel[]): void {
    this.publishedProblems = [...diagnostics];
  }

  public clearDiagnostics(): void {
    this.publishedProblems = [];
  }

  public refreshWorkspace(): void {
    // JetBrains workspace refresh logic placeholder
  }

  public updateIncrementally(diff: DiagnosticDiff): void {
    const existingMap = new Map<string, DiagnosticModel>();
    for (const d of this.publishedProblems) {
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
    this.publishedProblems = Array.from(existingMap.values());
  }

  public getPublished(): readonly DiagnosticModel[] {
    return this.publishedProblems;
  }
}
