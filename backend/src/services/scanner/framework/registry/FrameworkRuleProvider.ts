export interface FrameworkSecurityRule {
  readonly id: string;
  readonly description: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  validate(codeLines: string[]): boolean;
}

export class FrameworkRuleProvider {
  private rules: FrameworkSecurityRule[] = [
    {
      id: 'express-missing-helmet',
      description: 'Ensure Helmet middleware is configured to secure Express headers',
      severity: 'medium',
      validate: (lines) => lines.some(l => l.includes('helmet('))
    },
    {
      id: 'react-dangerous-html',
      description: 'Audit usage of dangerouslySetInnerHTML',
      severity: 'high',
      validate: (lines) => !lines.some(l => l.includes('dangerouslySetInnerHTML'))
    },
    {
      id: 'nestjs-missing-validation-pipe',
      description: 'Ensure global validation pipes are active in main bootstrapping entry',
      severity: 'medium',
      validate: (lines) => lines.some(l => l.includes('ValidationPipe'))
    }
  ];

  public getRules(): readonly FrameworkSecurityRule[] {
    return this.rules;
  }
}
