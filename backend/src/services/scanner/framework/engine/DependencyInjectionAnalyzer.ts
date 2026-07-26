export class DependencyInjectionAnalyzer {
  public static resolveProviders(codeLines: string[]): string[] {
    const resolved: string[] = [];
    for (const line of codeLines) {
      const constructorMatch = line.match(/constructor\s*\(([^)]+)\)/);
      if (constructorMatch) {
        const paramsStr = constructorMatch[1];
        const params = paramsStr.split(',');
        for (const param of params) {
          const match = param.match(/(?:private|public|protected)\s+readonly\s+\w+\s*:\s*(\w+)/);
          if (match) {
            resolved.push(match[1]);
          }
        }
      }
    }
    return resolved;
  }
}
