import { ObjectState } from '../models/ObjectState';

export class ObjectFlowAnalyzer {
  public static trackObjectMutations(codeLines: string[]): ObjectState {
    const properties = new Map<string, any>();
    let mutationsCount = 0;

    for (const line of codeLines) {
      const assignMatch = line.match(/(\w+)\.(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        const objName = assignMatch[1];
        const propName = assignMatch[2];
        const rawValue = assignMatch[3].trim();
        properties.set(`${objName}.${propName}`, rawValue);
        mutationsCount++;
      }
    }

    return {
      properties,
      mutationsCount
    };
  }
}
