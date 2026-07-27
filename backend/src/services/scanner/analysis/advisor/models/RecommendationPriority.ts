export type RecommendationPriorityType = 'Low' | 'Medium' | 'High';

export interface RecommendationPriority {
  readonly priority: RecommendationPriorityType;
  readonly weight: number;
}
