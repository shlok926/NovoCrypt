import { MemoryState } from './MemoryState';
import { PathCondition } from './PathCondition';

export interface FlowSummary {
  readonly inputState: MemoryState;
  readonly outputState: MemoryState;
  readonly pathConditions: readonly PathCondition[];
  readonly feasible: boolean;
}
