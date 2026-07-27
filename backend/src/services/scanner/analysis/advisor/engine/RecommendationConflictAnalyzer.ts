import { Recommendation } from '../models/Recommendation';

export interface RecommendationConflict {
  readonly idA: string;
  readonly idB: string;
  readonly isConflicting: boolean;
  readonly reason: string;
}

export class RecommendationConflictAnalyzer {
  public static analyzeConflicts(list: Recommendation[]): RecommendationConflict[] {
    const conflicts: RecommendationConflict[] = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        if (list[i].title === list[j].title) {
          conflicts.push({
            idA: list[i].recommendationId,
            idB: list[j].recommendationId,
            isConflicting: true,
            reason: `Duplicate titles found: ${list[i].title}`
          });
        }
      }
    }
    return conflicts;
  }
}
