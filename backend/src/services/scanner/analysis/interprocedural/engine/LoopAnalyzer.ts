import { PathCondition } from '../models/PathCondition';

export class LoopAnalyzer {
  public static analyzeLoops(codeLines: string[]): PathCondition[] {
    const conditions: PathCondition[] = [];
    for (const line of codeLines) {
      const match = line.match(/(?:while|for)\s*\((.+)\)/);
      if (match) {
        conditions.push({
          predicates: [match[1].trim()],
          feasible: true
        });
      }
    }
    return conditions;
  }
}
