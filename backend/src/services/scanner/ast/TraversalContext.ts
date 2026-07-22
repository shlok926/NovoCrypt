import { NovoNode } from './NovoNode';
import { TraversalMetrics } from './TraversalMetrics';

export interface TraversalContext {
  readonly filename: string;
  readonly language: string;
  readonly currentDepth: number;
  readonly path: NovoNode[];
  readonly parent?: NovoNode;
  readonly root: NovoNode;
  readonly metrics: TraversalMetrics;
  readonly visitorMetadata: Map<string, any>;
  
  /**
   * Request early termination of the traversal run.
   */
  requestStop(): void;
  isStopRequested(): boolean;
}
