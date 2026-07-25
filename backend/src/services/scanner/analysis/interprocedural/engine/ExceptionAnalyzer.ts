export interface ExceptionFlow {
  readonly throws: boolean;
  readonly caughtExceptionTypes: readonly string[];
}

export class ExceptionAnalyzer {
  public static analyzeExceptions(codeLines: string[]): ExceptionFlow {
    let throws = false;
    const caughtExceptionTypes: string[] = [];

    for (const line of codeLines) {
      if (line.includes('throw ')) {
        throws = true;
      }
      const catchMatch = line.match(/catch\s*\(\s*(\w+)\s*\)/);
      if (catchMatch) {
        caughtExceptionTypes.push('Error');
      }
    }

    return { throws, caughtExceptionTypes };
  }
}
