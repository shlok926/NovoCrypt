export class LoopExplorer {
  public static shouldExploreLoop(iterationsCount: number, limit = 5): boolean {
    return iterationsCount < limit;
  }
}
