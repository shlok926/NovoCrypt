import { SymbolicValue } from './SymbolicValue';

export interface SymbolicMemory {
  readonly heap: ReadonlyMap<string, SymbolicValue>;
  readonly stack: ReadonlyMap<string, SymbolicValue>;
}
