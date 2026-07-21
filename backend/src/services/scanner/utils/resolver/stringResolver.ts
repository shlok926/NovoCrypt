import { ResolvedString } from '../../types';

export class StringResolver {
  /**
   * Scans full target code to extract simple static string variable assignments.
   * e.g. const mode = "256"; const prefix = "AES-";
   */
  public static extractVariables(code: string): Map<string, string> {
    const vars = new Map<string, string>();
    const assignRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*["']([^"']+)["']/g;
    let match;
    while ((match = assignRegex.exec(code)) !== null) {
      vars.set(match[1], match[2]);
    }
    return vars;
  }

  /**
   * Resolves template literals or string concatenations in a single line.
   * Returns a structured ResolvedString object without modifying original code line.
   */
  public static resolveLine(line: string, variables: Map<string, string>): ResolvedString {
    const original = line;
    let resolved = line;
    let isResolved = false;

    // 1. Template literal resolution: `AES-${mode}-GCM`
    if (line.includes('`') && line.includes('${')) {
      resolved = line.replace(/`([^`]+)`/g, (match, body) => {
        const resolvedBody = body.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (varMatch: string, varName: string) => {
          if (variables.has(varName)) {
            isResolved = true;
            return variables.get(varName)!;
          }
          return varMatch;
        });
        return `"${resolvedBody}"`;
      });
    }

    // 2. Binary string concatenation resolution: "AES-" + mode + "-GCM"
    if (!isResolved && line.includes('+')) {
      const concatRegex = /((?:["'][^"']*["']|[a-zA-Z0-9_]+)\s*\+\s*(?:["'][^"']*["']|[a-zA-Z0-9_]+)(?:\s*\+\s*(?:["'][^"']*["']|[a-zA-Z0-9_]+))*)/g;
      resolved = line.replace(concatRegex, (match) => {
        const parts = match.split('+').map(p => p.trim());
        let combined = '';
        let valid = true;
        let modified = false;

        for (const part of parts) {
          if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
            combined += part.slice(1, -1);
          } else if (variables.has(part)) {
            combined += variables.get(part)!;
            modified = true;
          } else {
            valid = false;
            break;
          }
        }

        if (valid && modified) {
          isResolved = true;
          return `"${combined}"`;
        }
        return match;
      });
    }

    return {
      original,
      resolved,
      confidence: isResolved ? 90 : 70,
      isResolved
    };
  }

  /**
   * Resolves all lines in code string, producing a map of line number (1-indexed) -> ResolvedString.
   */
  public static resolveAll(code: string): Map<number, ResolvedString> {
    const variables = this.extractVariables(code);
    const resolvedMap = new Map<number, ResolvedString>();
    const lines = code.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      resolvedMap.set(lineNum, this.resolveLine(line, variables));
    });

    return resolvedMap;
  }
}
