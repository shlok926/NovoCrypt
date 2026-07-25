export class ParallelScheduler {
  public static async executeParallel<T, R>(
    items: readonly T[],
    workerFn: (item: T) => Promise<R>,
    workerCount = 4
  ): Promise<R[]> {
    const results: R[] = [];
    const queue = [...items];
    const activeWorkers: Promise<void>[] = [];

    const runWorker = async (): Promise<void> => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item !== undefined) {
          try {
            const res = await workerFn(item);
            results.push(res);
          } catch (e) {
            console.error('Worker task execution error:', e);
          }
        }
      }
    };

    for (let i = 0; i < Math.min(workerCount, items.length); i++) {
      activeWorkers.push(runWorker());
    }

    await Promise.all(activeWorkers);
    return results;
  }
}
