import { AliasSet } from './AliasSet';

export interface MemoryState {
  readonly heapObjects: ReadonlyMap<string, any>;
  readonly aliases: readonly AliasSet[];
  readonly objectLifetimes: ReadonlyMap<string, string>;
}
