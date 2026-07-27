export interface BestPractice {
  readonly id: string;
  readonly category: string;
  readonly advice: string;
}

export class BestPracticeRegistry {
  private practices = new Map<string, BestPractice>([
    [
      'express_security',
      {
        id: 'express_security',
        category: 'Express',
        advice: 'Always register express helmet middleware early in your server setup.'
      }
    ],
    [
      'react_security',
      {
        id: 'react_security',
        category: 'React',
        advice: 'Avoid dangerouslySetInnerHTML without DOMPurify sanitization.'
      }
    ]
  ]);

  public getPractice(id: string): BestPractice | undefined {
    return this.practices.get(id);
  }

  public registerPractice(bp: BestPractice): void {
    this.practices.set(bp.id, bp);
  }
}
