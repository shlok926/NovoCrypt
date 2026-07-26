export class ValidationAnalyzer {
  public static validate(replacementCode: string): boolean {
    try {
      new Function(replacementCode);
      return true;
    } catch {
      return replacementCode.includes('@') || replacementCode.includes('<') || replacementCode.includes('DOMPurify');
    }
  }
}
