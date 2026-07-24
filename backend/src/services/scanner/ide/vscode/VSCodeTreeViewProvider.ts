import { DiagnosticModel } from '../core/DiagnosticModel';

export interface TreeViewNode {
  readonly label: string;
  readonly children?: TreeViewNode[];
  readonly diagnostic?: DiagnosticModel;
}

export type GroupingStrategy = 'Severity' | 'Category' | 'File' | 'Rule';

export class VSCodeTreeViewProvider {
  public buildTree(
    diagnostics: readonly DiagnosticModel[],
    strategy: GroupingStrategy = 'Severity'
  ): TreeViewNode[] {
    switch (strategy) {
      case 'Severity':
        return this.groupBySeverity(diagnostics);
      case 'Category':
        return this.groupByCategory(diagnostics);
      case 'File':
        return this.groupByFile(diagnostics);
      case 'Rule':
        return this.groupByRule(diagnostics);
      default:
        return this.groupBySeverity(diagnostics);
    }
  }

  private groupBySeverity(diagnostics: readonly DiagnosticModel[]): TreeViewNode[] {
    const severityGroups = new Map<string, DiagnosticModel[]>();
    for (const d of diagnostics) {
      let list = severityGroups.get(d.severity);
      if (!list) {
        list = [];
        severityGroups.set(d.severity, list);
      }
      list.push(d);
    }

    return Array.from(severityGroups.entries()).map(([severity, diags]) => {
      return {
        label: `Severity: ${severity.toUpperCase()} (${diags.length})`,
        children: this.groupByCategory(diags)
      };
    });
  }

  private groupByCategory(diagnostics: readonly DiagnosticModel[]): TreeViewNode[] {
    const categoryGroups = new Map<string, DiagnosticModel[]>();
    for (const d of diagnostics) {
      let list = categoryGroups.get(d.category);
      if (!list) {
        list = [];
        categoryGroups.set(d.category, list);
      }
      list.push(d);
    }

    return Array.from(categoryGroups.entries()).map(([category, diags]) => {
      return {
        label: `Category: ${category} (${diags.length})`,
        children: diags.map(d => ({
          label: `[${d.ruleId}] ${d.title} (${d.file}:${d.startLine})`,
          diagnostic: d
        }))
      };
    });
  }

  private groupByFile(diagnostics: readonly DiagnosticModel[]): TreeViewNode[] {
    const fileGroups = new Map<string, DiagnosticModel[]>();
    for (const d of diagnostics) {
      let list = fileGroups.get(d.file);
      if (!list) {
        list = [];
        fileGroups.set(d.file, list);
      }
      list.push(d);
    }

    return Array.from(fileGroups.entries()).map(([file, diags]) => {
      return {
        label: `File: ${file} (${diags.length})`,
        children: diags.map(d => ({
          label: `[${d.severity.toUpperCase()}] ${d.title} (Line ${d.startLine})`,
          diagnostic: d
        }))
      };
    });
  }

  private groupByRule(diagnostics: readonly DiagnosticModel[]): TreeViewNode[] {
    const ruleGroups = new Map<string, DiagnosticModel[]>();
    for (const d of diagnostics) {
      let list = ruleGroups.get(d.ruleId);
      if (!list) {
        list = [];
        ruleGroups.set(d.ruleId, list);
      }
      list.push(d);
    }

    return Array.from(ruleGroups.entries()).map(([ruleId, diags]) => {
      return {
        label: `Rule: ${ruleId} (${diags.length})`,
        children: diags.map(d => ({
          label: `${d.file} - Line ${d.startLine}`,
          diagnostic: d
        }))
      };
    });
  }
}
