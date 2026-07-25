import { PathCondition } from '../models/PathCondition';

export class BranchAnalyzer {
  public static analyzeBranch(codeLines: string[]): PathCondition[] {
    const conditions: PathCondition[] = [];
    for (const line of codeLines) {
      const match = line.match(/if\s*\((.+)\)/);
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
