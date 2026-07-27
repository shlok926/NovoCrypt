import { RecommendationPriorityType } from './RecommendationPriority';

export interface Recommendation {
  readonly recommendationId: string;
  readonly title: string;
  readonly steps: readonly string[];
  readonly priority: RecommendationPriorityType;
}
