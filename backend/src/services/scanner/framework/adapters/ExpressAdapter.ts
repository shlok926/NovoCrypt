import { FrameworkAdapter } from '../registry/FrameworkRegistry';

export class ExpressAdapter implements FrameworkAdapter {
  public readonly name = 'Express';

  public detect(codeLines: string[]): boolean {
    return codeLines.some(l => l.includes('express()') || l.includes("require('express')") || l.includes('import express'));
  }

  public getEndpoints(codeLines: string[]): any[] {
    return codeLines.filter(l => l.match(/(?:app|router)\.(get|post|put|delete)/));
  }

  public getMiddlewares(codeLines: string[]): any[] {
    return codeLines.filter(l => l.includes('app.use('));
  }
}
