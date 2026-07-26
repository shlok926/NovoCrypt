import { FrameworkAdapter } from '../registry/FrameworkRegistry';

export class VueAdapter implements FrameworkAdapter {
  public readonly name = 'Vue';

  public detect(codeLines: string[]): boolean {
    return codeLines.some(l => l.includes('import Vue') || l.includes('defineComponent') || l.includes('v-model') || l.includes('import { ref'));
  }

  public getEndpoints(codeLines: string[]): any[] {
    return [];
  }

  public getMiddlewares(codeLines: string[]): any[] {
    return [];
  }
}
