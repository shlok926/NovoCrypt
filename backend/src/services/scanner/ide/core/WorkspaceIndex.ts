import { DiagnosticModel } from './DiagnosticModel';

export class WorkspaceIndex {
  private byFile = new Map<string, Set<DiagnosticModel>>();
  private byRule = new Map<string, Set<DiagnosticModel>>();
  private bySeverity = new Map<string, Set<DiagnosticModel>>();
  private byFramework = new Map<string, Set<DiagnosticModel>>();
  private byFingerprint = new Map<string, DiagnosticModel>();

  public add(diag: DiagnosticModel): void {
    // Remove previous instance with same fingerprint if it exists
    if (this.byFingerprint.has(diag.fingerprint)) {
      this.remove(diag.fingerprint);
    }

    this.byFingerprint.set(diag.fingerprint, diag);

    this.addToIndex(this.byFile, diag.file, diag);
    this.addToIndex(this.byRule, diag.ruleId, diag);
    this.addToIndex(this.bySeverity, diag.severity, diag);
    this.addToIndex(this.byFramework, diag.framework, diag);
  }

  public remove(fingerprint: string): void {
    const diag = this.byFingerprint.get(fingerprint);
    if (!diag) return;

    this.byFingerprint.delete(fingerprint);

    this.removeFromIndex(this.byFile, diag.file, diag);
    this.removeFromIndex(this.byRule, diag.ruleId, diag);
    this.removeFromIndex(this.bySeverity, diag.severity, diag);
    this.removeFromIndex(this.byFramework, diag.framework, diag);
  }

  public clear(): void {
    this.byFile.clear();
    this.byRule.clear();
    this.bySeverity.clear();
    this.byFramework.clear();
    this.byFingerprint.clear();
  }

  public getByFile(file: string): readonly DiagnosticModel[] {
    const normalized = file.replace(/\\/g, '/');
    return Array.from(this.byFile.get(normalized) || []);
  }

  public getByRule(ruleId: string): readonly DiagnosticModel[] {
    return Array.from(this.byRule.get(ruleId) || []);
  }

  public getBySeverity(severity: string): readonly DiagnosticModel[] {
    return Array.from(this.bySeverity.get(severity) || []);
  }

  public getByFramework(framework: string): readonly DiagnosticModel[] {
    return Array.from(this.byFramework.get(framework) || []);
  }

  public getByFingerprint(fingerprint: string): DiagnosticModel | undefined {
    return this.byFingerprint.get(fingerprint);
  }

  public getAll(): readonly DiagnosticModel[] {
    return Array.from(this.byFingerprint.values());
  }

  private addToIndex(map: Map<string, Set<DiagnosticModel>>, key: string, diag: DiagnosticModel): void {
    let set = map.get(key);
    if (!set) {
      set = new Set<DiagnosticModel>();
      map.set(key, set);
    }
    set.add(diag);
  }

  private removeFromIndex(map: Map<string, Set<DiagnosticModel>>, key: string, diag: DiagnosticModel): void {
    const set = map.get(key);
    if (set) {
      set.delete(diag);
      if (set.size === 0) {
        map.delete(key);
      }
    }
  }
}
