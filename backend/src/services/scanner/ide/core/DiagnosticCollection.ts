import { DiagnosticModel } from './DiagnosticModel';
import { WorkspaceIndex } from './WorkspaceIndex';

export class DiagnosticCollection {
  private index = new WorkspaceIndex();

  public set(diagnostics: readonly DiagnosticModel[]): void {
    this.index.clear();
    for (const d of diagnostics) {
      this.index.add(d);
    }
  }

  public add(diag: DiagnosticModel): void {
    this.index.add(diag);
  }

  public remove(fingerprint: string): void {
    this.index.remove(fingerprint);
  }

  public clear(): void {
    this.index.clear();
  }

  public getIndex(): WorkspaceIndex {
    return this.index;
  }
}
