import { DependencyGraph } from '../workspace/DependencyGraph';
import { AnalysisCache } from '../cache/AnalysisCache';

export class IncrementalScanner {
  public static invalidateAffected(
    changedFiles: readonly string[],
    dependencyGraph: DependencyGraph,
    cache: AnalysisCache
  ): string[] {
    const affected = new Set<string>();

    for (const f of changedFiles) {
      const normalized = f.replace(/\\/g, '/');
      affected.add(normalized);

      const dependents = dependencyGraph.getTransitiveDependents(normalized);
      for (const dep of dependents) {
        affected.add(dep);
      }
    }

    affected.forEach(file => {
      cache.delete(file);
    });

    return Array.from(affected);
  }
}
