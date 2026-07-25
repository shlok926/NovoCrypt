import { AliasSet } from '../models/AliasSet';

export class AliasAnalyzer {
  public static analyzeAliases(codeLines: string[]): AliasSet[] {
    const aliasesList: AliasSet[] = [];
    const varMap = new Map<string, string>();
    let groupCounter = 0;

    for (const line of codeLines) {
      const match = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*(\w+)\s*$/);
      if (match) {
        const left = match[1];
        const right = match[2];

        let groupId = varMap.get(right);
        if (!groupId) {
          groupId = `alias-group-${++groupCounter}`;
          varMap.set(right, groupId);
        }
        varMap.set(left, groupId);
      }
    }

    const groups = new Map<string, string[]>();
    varMap.forEach((groupId, varName) => {
      let vars = groups.get(groupId);
      if (!vars) {
        vars = [];
        groups.set(groupId, vars);
      }
      vars.push(varName);
    });

    groups.forEach((variables, id) => {
      aliasesList.push({ id, variables });
    });

    return aliasesList;
  }
}
