import { IDEAdapter } from './IDEAdapter';
import { DiagnosticModel } from '../core/DiagnosticModel';
import { DiagnosticDiff } from '../core/DiagnosticDiff';

export class FutureAdapter implements IDEAdapter {
  public readonly name = 'Future IDE';
  private buffer: DiagnosticModel[] = [];

  public publishDiagnostics(diagnostics: readonly DiagnosticModel[]): void {
    this.buffer = [...diagnostics];
  }

  public clearDiagnostics(): void {
    this.buffer = [];
  }

  public refreshWorkspace(): void {
    // Placeholder
  }

  public updateIncrementally(diff: DiagnosticDiff): void {
    const existingMap = new Map<string, DiagnosticModel>();
    for (const d of this.buffer) {
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
    this.buffer = Array.from(existingMap.values());
  }

  public getPublished(): readonly DiagnosticModel[] {
    return this.buffer;
  }
}
