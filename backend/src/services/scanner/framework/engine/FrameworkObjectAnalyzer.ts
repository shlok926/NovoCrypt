import { FrameworkObject } from '../models/FrameworkObject';

export class FrameworkObjectAnalyzer {
  public static resolveObjects(codeLines: string[]): FrameworkObject[] {
    const list: FrameworkObject[] = [];
    for (const line of codeLines) {
      if (line.includes('req: Request') || line.includes('req: any')) {
        list.push({
          name: 'req',
          type: 'Request',
          fields: ['query', 'body', 'params']
        });
      }
      if (line.includes('useState(')) {
        list.push({
          name: 'state',
          type: 'ReactState',
          fields: ['value', 'setter']
        });
      }
    }
    return list;
  }
}
