export interface FixPattern {
  readonly id: string;
  readonly category: string;
  readonly templateBefore: string;
  readonly templateAfter: string;
}

export class FixPatternRegistry {
  private patterns = new Map<string, FixPattern>([
    [
      'sqli_query',
      {
        id: 'sqli_query',
        category: 'sql_injection',
        templateBefore: 'db.query("SELECT * FROM users WHERE id=" + id)',
        templateAfter: 'db.query("SELECT * FROM users WHERE id=?", [id])'
      }
    ]
  ]);

  public getPattern(id: string): FixPattern | undefined {
    return this.patterns.get(id);
  }

  public registerPattern(pattern: FixPattern): void {
    this.patterns.set(pattern.id, pattern);
  }
}
