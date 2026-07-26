import { FrameworkAdapter } from '../registry/FrameworkRegistry';

export class NestJSAdapter implements FrameworkAdapter {
  public readonly name = 'NestJS';

  public detect(codeLines: string[]): boolean {
    return codeLines.some(l => l.includes('@Controller') || l.includes('@Injectable'));
  }

  public getEndpoints(codeLines: string[]): any[] {
    return codeLines.filter(l => l.includes('@Get(') || l.includes('@Post('));
  }

  public getMiddlewares(codeLines: string[]): any[] {
    return codeLines.filter(l => l.includes('@UseGuards('));
  }
}
