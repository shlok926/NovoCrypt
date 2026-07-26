import { MiddlewareModel } from '../models/MiddlewareModel';

export class MiddlewareAnalyzer {
  public static parseMiddleware(line: string, index: number): MiddlewareModel | undefined {
    const match = line.match(/(?:app|router)\.use\s*\(\s*(\w+)/);
    if (match) {
      const name = match[1];
      const type = name.toLowerCase().includes('auth') ? 'authentication' : 'generic';
      return {
        name,
        orderIndex: index,
        type,
        bypassed: false
      };
    }
    return undefined;
  }
}
