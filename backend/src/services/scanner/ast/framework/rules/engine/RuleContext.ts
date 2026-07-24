import { FrameworkMetadata } from '../../models/FrameworkMetadata';
import { FrameworkSemanticModel } from '../../semantic/models/FrameworkSemanticModel';
import { RequestExecutionPipeline } from '../../semantic/models/RequestExecutionPipeline';
import { RequestLifecycle } from '../../semantic/models/RequestLifecycle';
import { CallGraph } from '../../../callgraph/CallGraph';
import { FlowGraph } from '../../../dataflow/FlowGraph';

export interface RuleContext {
  readonly metadata: FrameworkMetadata;
  readonly model: FrameworkSemanticModel;
  readonly pipeline: RequestExecutionPipeline;
  readonly lifecycle: RequestLifecycle;
  readonly callGraph: CallGraph;
  readonly dataFlow: FlowGraph;
}
