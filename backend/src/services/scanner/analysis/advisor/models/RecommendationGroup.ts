import { Recommendation } from './Recommendation';

export interface RecommendationGroup {
  readonly groupId: string;
  readonly recommendations: readonly Recommendation[];
}
