import { FrameworkAdapter } from '../registry/FrameworkRegistry';

export class ReactAdapter implements FrameworkAdapter {
  public readonly name = 'React';

  public detect(codeLines: string[]): boolean {
    return codeLines.some(l => l.includes('import React') || l.includes('useState(') || l.includes('useEffect(') || l.includes('import { useState'));
  }

  public getEndpoints(codeLines: string[]): any[] {
    return [];
  }

  public getMiddlewares(codeLines: string[]): any[] {
    return [];
  }
}
