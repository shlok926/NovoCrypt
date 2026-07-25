export class LoopBoundAnalyzer {
  public static isLoopBoundReached(iterationCount: number, maxIterations = 5): boolean {
    return iterationCount >= maxIterations;
  }
}
