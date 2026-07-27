import { FixComparison } from '../models/FixComparison';

export class FixComparator {
  public static compare(strategies: string[]): FixComparison[] {
    const list: FixComparison[] = [];
    strategies.forEach(s => {
      if (s === 'parameterize') {
        list.push({
          strategy: 'parameterize',
          security: 'High',
          compatibility: 'High',
          complexity: 'Low'
        });
      } else if (s === 'orm') {
        list.push({
          strategy: 'orm',
          security: 'High',
          compatibility: 'Medium',
          complexity: 'High'
        });
      }
    });
    return list;
  }
}
