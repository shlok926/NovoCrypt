import { Recommendation } from '../models/Recommendation';

export class PrioritisationEngine {
  public static sort(list: Recommendation[]): Recommendation[] {
    const order = { High: 3, Medium: 2, Low: 1 };
    return [...list].sort((a, b) => order[b.priority] - order[a.priority]);
  }
}
