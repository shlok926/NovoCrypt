import { BehaviourImpact } from '../models/BehaviourImpact';

export class BehaviourAnalyzer {
  public static analyze(original: string, replacement: string): BehaviourImpact {
    const origMatch = original.match(/(\w+)\s*\(/);
    const replMatch = replacement.match(/(\w+)\s*\(/);

    const apiPreserved = origMatch && replMatch ? origMatch[1] === replMatch[1] : true;

    return {
      apiPreserved,
      logicPreserved: true,
      performanceImpact: 'low'
    };
  }
}
