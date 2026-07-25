import { SymbolicState } from '../models/SymbolicState';

export class StateMerger {
  public static merge(
    s1: SymbolicState,
    s2: SymbolicState
  ): SymbolicState | undefined {
    const k1 = s1.constraints.constraints
      .map(c => `${(c.expression.left as any).name || ''}:${c.expression.operator}:${c.expression.right}`)
      .join(' && ');
    const k2 = s2.constraints.constraints
      .map(c => `${(c.expression.left as any).name || ''}:${c.expression.operator}:${c.expression.right}`)
      .join(' && ');

    if (k1 === k2) {
      const mergedHeap = new Map(s1.memory.heap);
      s2.memory.heap.forEach((v, k) => mergedHeap.set(k, v));

      const mergedTainted = new Set([...s1.taintedVariables, ...s2.taintedVariables]);

      return {
        id: `${s1.id}-merged`,
        memory: {
          heap: mergedHeap,
          stack: s1.memory.stack
        },
        constraints: s1.constraints,
        pathState: s1.pathState,
        trace: s1.trace,
        taintedVariables: mergedTainted
      };
    }
    return undefined;
  }
}
