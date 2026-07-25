import { SymbolicMemory } from '../models/SymbolicMemory';
import { SymbolicValue } from '../models/SymbolicValue';

export class SymbolicMemoryManager {
  public static allocateObject(
    memory: SymbolicMemory,
    varName: string,
    type: 'integer' | 'string' | 'boolean' | 'object' | 'array' | 'null' | 'undefined' | 'unknown' = 'unknown'
  ): SymbolicMemory {
    const val: SymbolicValue = {
      name: `alpha_${varName}`,
      type
    };

    const nextHeap = new Map(memory.heap);
    nextHeap.set(varName, val);

    return {
      heap: nextHeap,
      stack: memory.stack
    };
  }
}
