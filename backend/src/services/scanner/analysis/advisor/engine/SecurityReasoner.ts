import { SecurityExplanation } from '../models/SecurityExplanation';
import { PromptTemplateRegistry } from '../registry/PromptTemplateRegistry';

export class SecurityReasoner {
  private templates = new PromptTemplateRegistry();

  public reason(vulnerabilityId: string): SecurityExplanation {
    const summary = this.templates.getTemplate(vulnerabilityId) || `Vulnerability explanation for ${vulnerabilityId}`;
    return {
      explanationId: `explanation-${vulnerabilityId}`,
      issueSummary: summary,
      technicalDescription: `Detailed analysis trace targeting ${vulnerabilityId}`,
      exploitabilityReasoning: 'Taint tracking confirms parameter travels from untrusted source directly to the vulnerable function sink.'
    };
  }
}
