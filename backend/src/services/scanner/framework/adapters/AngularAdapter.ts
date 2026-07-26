import { FrameworkAdapter } from '../registry/FrameworkRegistry';

export class AngularAdapter implements FrameworkAdapter {
  public readonly name = 'Angular';

  public detect(codeLines: string[]): boolean {
    return codeLines.some(l => l.includes('@Component') || l.includes('@NgModule') || l.includes('ngOnInit('));
  }

  public getEndpoints(codeLines: string[]): any[] {
    return [];
  }

  public getMiddlewares(codeLines: string[]): any[] {
    return [];
  }
}
