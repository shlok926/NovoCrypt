import { Recommendation } from '../models/Recommendation';
import { RecommendationRegistry } from '../registry/RecommendationRegistry';

export class RecommendationGenerator {
  private registry = new RecommendationRegistry();

  public generate(vulnerabilityId: string): Recommendation {
    const defaultRec = this.registry.getRecommendation(vulnerabilityId);
    if (defaultRec) return defaultRec;

    return {
      recommendationId: `rec_${vulnerabilityId}`,
      title: `Remediate ${vulnerabilityId} security parameters`,
      steps: ['Scan the parameter input references', 'Ensure verification and sanitizers exist'],
      priority: 'Medium'
    };
  }
}
