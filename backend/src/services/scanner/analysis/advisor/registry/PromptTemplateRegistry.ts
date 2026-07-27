export class PromptTemplateRegistry {
  private templates = new Map<string, string>([
    [
      'sql_injection',
      'Vulnerability Explanation: SQL Injection vulnerability found in target execution sink. The input parameters are merged directly without proper sanitization.'
    ],
    [
      'xss',
      'Vulnerability Explanation: Cross-Site Scripting (XSS) vulnerability found. The variables are rendered dynamically into the template payload.'
    ]
  ]);

  public getTemplate(id: string): string | undefined {
    return this.templates.get(id);
  }

  public registerTemplate(id: string, text: string): void {
    this.templates.set(id, text);
  }
}
