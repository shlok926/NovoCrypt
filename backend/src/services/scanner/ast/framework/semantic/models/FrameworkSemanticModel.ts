import { RequestExecutionPipeline } from './RequestExecutionPipeline';
import { PipelineContext } from './PipelineContext';
import { NovoNode } from '../../../NovoNode';

export class FrameworkSemanticModel {
  public readonly pipelines: readonly RequestExecutionPipeline[];
  public readonly contexts: readonly PipelineContext[];
  
  private handlerToPipeline = new Map<unknown, RequestExecutionPipeline>();
  private handlerToContext = new Map<unknown, PipelineContext>();

  constructor(pipelines: RequestExecutionPipeline[], contexts: PipelineContext[]) {
    this.pipelines = [...pipelines];
    this.contexts = [...contexts];
    for (const ctx of this.contexts) {
      const ref = ctx.pipeline.handler.rawReference?.ref;
      if (ref) {
        this.handlerToPipeline.set(ref, ctx.pipeline);
        this.handlerToContext.set(ref, ctx);
      }
    }
  }

  public getPipeline(handlerNode: NovoNode): RequestExecutionPipeline | undefined {
    const ref = handlerNode.rawReference?.ref;
    return ref ? this.handlerToPipeline.get(ref) : undefined;
  }

  public getContext(handlerNode: NovoNode): PipelineContext | undefined {
    const ref = handlerNode.rawReference?.ref;
    return ref ? this.handlerToContext.get(ref) : undefined;
  }
}
