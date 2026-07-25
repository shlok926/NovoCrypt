export class RecursionAnalyzer {
  public static detectRecursion(
    funcId: string,
    callString: readonly string[],
    limit = 5
  ): { recursive: boolean; cutoff: boolean } {
    const occurrences = callString.filter(c => c === funcId).length;
    return {
      recursive: occurrences > 0,
      cutoff: occurrences >= limit
    };
  }
}
