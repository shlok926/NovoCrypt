import { MemoryState } from '../models/MemoryState';
import { AliasSet } from '../models/AliasSet';

export class FlowMerger {
  public static merge(states: readonly MemoryState[]): MemoryState {
    if (states.length === 0) {
      return {
        heapObjects: new Map(),
        aliases: [],
        objectLifetimes: new Map()
      };
    }
    if (states.length === 1) {
      return states[0];
    }

    const mergedHeap = new Map<string, any>();
    const mergedLifetimes = new Map<string, string>();
    const aliasesMap = new Map<string, Set<string>>();

    for (const state of states) {
      state.heapObjects.forEach((val, key) => {
        mergedHeap.set(key, val);
      });

      state.objectLifetimes.forEach((val, key) => {
        const current = mergedLifetimes.get(key);
        if (current === 'escaped' || val === 'escaped') {
          mergedLifetimes.set(key, 'escaped');
        } else {
          mergedLifetimes.set(key, val);
        }
      });

      for (const alias of state.aliases) {
        let set = aliasesMap.get(alias.id);
        if (!set) {
          set = new Set<string>();
          aliasesMap.set(alias.id, set);
        }
        alias.variables.forEach(v => set?.add(v));
      }
    }

    const mergedAliases: AliasSet[] = Array.from(aliasesMap.entries()).map(([id, set]) => ({
      id,
      variables: Array.from(set)
    }));

    return {
      heapObjects: mergedHeap,
      aliases: mergedAliases,
      objectLifetimes: mergedLifetimes
    };
  }
}
