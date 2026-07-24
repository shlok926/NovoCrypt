import { DiagnosticModel } from './core/DiagnosticModel';
import { DiagnosticCollection } from './core/DiagnosticCollection';
import { DiagnosticMapper } from './core/DiagnosticMapper';
import { DiagnosticDiff } from './core/DiagnosticDiff';
import { WorkspaceSnapshot } from './core/WorkspaceSnapshot';
import { IncrementalUpdate } from './core/IncrementalUpdate';
import { IDEAdapter } from './adapters/IDEAdapter';
import { IDEConfigurationManager, IDEConfiguration } from './IDEConfiguration';

export class IDEIntegrationEngine {
  private collections = new Map<string, DiagnosticCollection>();
  private adapters = new Map<string, Set<IDEAdapter>>();
  private configManager = new IDEConfigurationManager();

  public updateConfig(config: IDEConfiguration): void {
    this.configManager.updateConfiguration(config);
  }

  public registerAdapter(workspaceId: string, adapter: IDEAdapter): void {
    let set = this.adapters.get(workspaceId);
    if (!set) {
      set = new Set<IDEAdapter>();
      this.adapters.set(workspaceId, set);
    }
    set.add(adapter);
  }

  public deregisterAdapter(workspaceId: string, adapter: IDEAdapter): void {
    const set = this.adapters.get(workspaceId);
    if (set) {
      set.delete(adapter);
      if (set.size === 0) {
        this.adapters.delete(workspaceId);
      }
    }
  }

  public getCollection(workspaceId: string): DiagnosticCollection {
    let coll = this.collections.get(workspaceId);
    if (!coll) {
      coll = new DiagnosticCollection();
      this.collections.set(workspaceId, coll);
    }
    return coll;
  }

  public publishDiagnostics(workspaceId: string, diagnostics: readonly DiagnosticModel[]): void {
    const coll = this.getCollection(workspaceId);
    
    // Apply configurations filtering
    const filtered = diagnostics
      .filter(d => this.configManager.shouldInclude(d))
      .slice(0, this.configManager.getConfiguration().maxDiagnosticsCount || 100000);

    coll.set(filtered);

    const workspaceAdapters = this.adapters.get(workspaceId);
    if (workspaceAdapters) {
      for (const adapter of workspaceAdapters) {
        adapter.publishDiagnostics(filtered);
      }
    }
  }

  public clearDiagnostics(workspaceId: string): void {
    const coll = this.collections.get(workspaceId);
    if (coll) {
      coll.clear();
    }

    const workspaceAdapters = this.adapters.get(workspaceId);
    if (workspaceAdapters) {
      for (const adapter of workspaceAdapters) {
        adapter.clearDiagnostics();
      }
    }
  }

  public refreshWorkspace(workspaceId: string): void {
    const workspaceAdapters = this.adapters.get(workspaceId);
    if (workspaceAdapters) {
      for (const adapter of workspaceAdapters) {
        adapter.refreshWorkspace();
      }
    }
  }

  public updateIncrementally(workspaceId: string, current: readonly DiagnosticModel[]): void {
    const coll = this.getCollection(workspaceId);
    const previous = coll.getIndex().getAll();

    // Apply configuration filters to current
    const filteredCurrent = current
      .filter(d => this.configManager.shouldInclude(d))
      .slice(0, this.configManager.getConfiguration().maxDiagnosticsCount || 100000);

    const diff = IncrementalUpdate.computeDiff(previous, filteredCurrent);

    // Apply diff to collection index
    for (const r of diff.removed) {
      coll.remove(r.fingerprint);
    }
    for (const u of diff.updated) {
      coll.add(u);
    }
    for (const a of diff.added) {
      coll.add(a);
    }

    const workspaceAdapters = this.adapters.get(workspaceId);
    if (workspaceAdapters) {
      for (const adapter of workspaceAdapters) {
        adapter.updateIncrementally(diff);
      }
    }
  }

  public loadSarif(sarifReport: any): DiagnosticModel[] {
    const diagnostics: DiagnosticModel[] = [];
    if (!sarifReport || !Array.isArray(sarifReport.runs)) return [];

    for (const run of sarifReport.runs) {
      const rules = run.tool?.driver?.rules || [];
      if (Array.isArray(run.results)) {
        for (const result of run.results) {
          diagnostics.push(DiagnosticMapper.fromSarif(result, rules));
        }
      }
    }

    return diagnostics;
  }

  public exportDiagnostics(workspaceId: string): DiagnosticModel[] {
    const coll = this.collections.get(workspaceId);
    if (!coll) return [];
    return [...coll.getIndex().getAll()];
  }

  public createSnapshot(workspaceId: string, scanId: string, version = '1.0.0'): WorkspaceSnapshot {
    const diags = this.exportDiagnostics(workspaceId);
    return {
      workspaceId,
      diagnostics: diags,
      timestamp: Date.now(),
      version,
      scanId
    };
  }
}
