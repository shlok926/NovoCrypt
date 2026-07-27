import { Recommendation } from '../models/Recommendation';

export class RecommendationRegistry {
  private recommendations = new Map<string, Recommendation>([
    [
      'sql_injection',
      {
        recommendationId: 'rec_sqli',
        title: 'Use parameterized queries instead of string concatenation',
        steps: [
          'Locate query statement in target method code',
          'Use query parameters placeholder token (?)',
          'Pass input arguments inside arrays list'
        ],
        priority: 'High'
      }
    ],
    [
      'xss',
      {
        recommendationId: 'rec_xss',
        title: 'Sanitize dynamic HTML attributes values',
        steps: [
          'Locate dangerouslySetInnerHTML rendering calls',
          'Wrap parameters inside DOMPurify.sanitize calls'
        ],
        priority: 'High'
      }
    ]
  ]);

  public getRecommendation(id: string): Recommendation | undefined {
    return this.recommendations.get(id);
  }

  public registerRecommendation(rec: Recommendation): void {
    this.recommendations.set(rec.recommendationId, rec);
  }
}
