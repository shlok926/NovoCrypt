import { DiagnosticModel } from '../core/DiagnosticModel';
import { JetBrainsProblem, JetBrainsProblemMapper } from './JetBrainsProblemMapper';

export class JetBrainsInspectionAdapter {
  private inspectionProfileName = 'NovoCrypt Security Audits';
  private inspectionsEnabled = true;

  public runInspection(diagnostics: readonly DiagnosticModel[]): JetBrainsProblem[] {
    if (!this.inspectionsEnabled) return [];
    return JetBrainsProblemMapper.mapToJetBrains(diagnostics);
  }

  public getProfileName(): string {
    return this.inspectionProfileName;
  }

  public setInspectionsEnabled(enabled: boolean): void {
    this.inspectionsEnabled = enabled;
  }
}
