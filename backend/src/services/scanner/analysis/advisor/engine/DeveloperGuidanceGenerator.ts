import { SecurityInsight } from '../models/SecurityInsight';

export class DeveloperGuidanceGenerator {
  public static generate(vulnerabilityId: string): SecurityInsight[] {
    return [
      {
        level: 'beginner',
        explanation: 'Do not trust raw user input in database parameters.'
      },
      {
        level: 'intermediate',
        explanation: 'In Express controllers, validate req.body parameters.'
      },
      {
        level: 'advanced',
        explanation: 'Enforce parameterized queries at the data repository level layers.'
      }
    ];
  }
}
