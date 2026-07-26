export interface DecoratorMetadata {
  readonly decoratorName: string;
  readonly arguments: readonly string[];
}

export class DecoratorAnalyzer {
  public static parseDecorators(codeLines: string[]): DecoratorMetadata[] {
    const list: DecoratorMetadata[] = [];
    for (const line of codeLines) {
      const match = line.match(/@(\w+)\s*\(([^)]*)\)/);
      if (match) {
        list.push({
          decoratorName: match[1],
          arguments: match[2] ? match[2].split(',').map(s => s.trim().replace(/['"`]/g, '')) : []
        });
      }
    }
    return list;
  }
}
