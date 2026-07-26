export interface FlowElementMetadata {
  readonly element: string;
  readonly category: 'source' | 'sink';
}

export class SourceSinkResolver {
  public static resolve(codeLines: string[]): FlowElementMetadata[] {
    const list: FlowElementMetadata[] = [];
    for (const line of codeLines) {
      if (line.includes('req.query') || line.includes('req.body') || line.includes('req.params')) {
        list.push({
          element: 'req',
          category: 'source'
        });
      }
      if (line.includes('db.query') || line.includes('executeQuery(') || line.includes('eval(')) {
        list.push({
          element: 'query',
          category: 'sink'
        });
      }
    }
    return list;
  }
}
