import { FrameworkType } from '../../models/FrameworkModel';
import { RequestExecutionPipeline } from './RequestExecutionPipeline';
import { RequestLifecycle } from './RequestLifecycle';

export interface PipelineContext {
  readonly framework: FrameworkType;
  readonly routePath: string;
  readonly httpMethod: string;
  readonly pipeline: RequestExecutionPipeline;
  readonly lifecycle: RequestLifecycle;
}
