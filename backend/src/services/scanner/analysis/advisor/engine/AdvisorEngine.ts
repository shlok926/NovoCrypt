import { SecurityExplanation } from '../models/SecurityExplanation';
import { SecurityInsight } from '../models/SecurityInsight';
import { ReasoningTrace } from '../models/ReasoningTrace';
import { SecurityReasoner } from './SecurityReasoner';
import { DeveloperGuidanceGenerator } from './DeveloperGuidanceGenerator';
import { EvidenceLinker } from './EvidenceLinker';

export class AdvisorEngine {
  private reasoner = new SecurityReasoner();

  public compileAdvisorSummary(
    vulnerabilityId: string,
    filePath: string,
    steps: string[]
  ): { explanation: SecurityExplanation; insights: SecurityInsight[]; trace: ReasoningTrace } {
    const explanation = this.reasoner.reason(vulnerabilityId);
    const insights = DeveloperGuidanceGenerator.generate(vulnerabilityId);
    const trace = EvidenceLinker.link(vulnerabilityId, steps);

    return {
      explanation,
      insights,
      trace
    };
  }
}
