import { DiagnosticModel } from './DiagnosticModel';
import { DiagnosticDiff } from './DiagnosticDiff';

export class IncrementalUpdate {
  public static computeDiff(
    previous: readonly DiagnosticModel[],
    current: readonly DiagnosticModel[]
  ): DiagnosticDiff {
    const prevMap = new Map<string, DiagnosticModel>();
    for (const d of previous) {
      prevMap.set(d.fingerprint, d);
    }

    const currMap = new Map<string, DiagnosticModel>();
    for (const d of current) {
      currMap.set(d.fingerprint, d);
    }

    const added: DiagnosticModel[] = [];
    const updated: DiagnosticModel[] = [];
    const removed: DiagnosticModel[] = [];

    for (const d of current) {
      const prev = prevMap.get(d.fingerprint);
      if (!prev) {
        added.push(d);
      } else if (this.isModified(prev, d)) {
        updated.push(d);
      }
    }

    for (const d of previous) {
      if (!currMap.has(d.fingerprint)) {
        removed.push(d);
      }
    }

    return { added, updated, removed };
  }

  private static isModified(a: DiagnosticModel, b: DiagnosticModel): boolean {
    return (
      a.severity !== b.severity ||
      a.description !== b.description ||
      a.startLine !== b.startLine ||
      a.startColumn !== b.startColumn ||
      a.endLine !== b.endLine ||
      a.endColumn !== b.endColumn
    );
  }
}
