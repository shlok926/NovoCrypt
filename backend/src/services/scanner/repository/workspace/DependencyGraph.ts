export interface DependencyEdge {
  readonly from: string;
  readonly to: string;
  readonly specifier: string;
}

export class DependencyGraph {
  private adjacencyList = new Map<string, Map<string, string>>(); // fromFile -> (toFile -> specifier)
  private reverseAdjacencyList = new Map<string, Set<string>>();  // toFile -> Set<fromFile>

  public addDependency(fromFile: string, toFile: string, specifier: string): void {
    const normalizedFrom = fromFile.replace(/\\/g, '/');
    const normalizedTo = toFile.replace(/\\/g, '/');

    let targets = this.adjacencyList.get(normalizedFrom);
    if (!targets) {
      targets = new Map<string, string>();
      this.adjacencyList.set(normalizedFrom, targets);
    }
    targets.set(normalizedTo, specifier);

    let sources = this.reverseAdjacencyList.get(normalizedTo);
    if (!sources) {
      sources = new Set<string>();
      this.reverseAdjacencyList.set(normalizedTo, sources);
    }
    sources.add(normalizedFrom);
  }

  public getDirectDependencies(file: string): readonly string[] {
    const normalized = file.replace(/\\/g, '/');
    const targets = this.adjacencyList.get(normalized);
    return targets ? Array.from(targets.keys()) : [];
  }

  public getDependents(file: string): readonly string[] {
    const normalized = file.replace(/\\/g, '/');
    return Array.from(this.reverseAdjacencyList.get(normalized) || []);
  }

  public getTransitiveDependents(file: string): readonly string[] {
    const normalized = file.replace(/\\/g, '/');
    const visited = new Set<string>();
    const queue: string[] = [normalized];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dependents = this.getDependents(current);
      for (const dep of dependents) {
        if (!visited.has(dep)) {
          visited.add(dep);
          queue.push(dep);
        }
      }
    }

    return Array.from(visited);
  }

  public hasCycle(): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (node: string): boolean => {
      if (recStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recStack.add(node);

      const neighbors = this.getDirectDependencies(node);
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) return true;
      }

      recStack.delete(node);
      return false;
    };

    const allFiles = Array.from(this.adjacencyList.keys());
    for (const file of allFiles) {
      if (dfs(file)) return true;
    }

    return false;
  }

  public clear(): void {
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
  }
}
