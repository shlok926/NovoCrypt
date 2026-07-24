import { FrameworkMetadata } from '../models/FrameworkMetadata';
import { FrameworkSemanticModel } from './models/FrameworkSemanticModel';
import { RequestExecutionPipeline } from './models/RequestExecutionPipeline';
import { RequestLifecycle } from './models/RequestLifecycle';
import { PipelineContext } from './models/PipelineContext';
import { MiddlewareComponent } from './models/MiddlewareComponent';
import { PipelineBuilder } from './builders/PipelineBuilder';
import { LifecycleBuilder } from './builders/LifecycleBuilder';
import { NovoNode } from '../../NovoNode';

export class FrameworkSemanticEngine {
  
  public buildSemanticModel(metadata: FrameworkMetadata): FrameworkSemanticModel {
    const pipelines = PipelineBuilder.buildPipelines(metadata);
    const contexts: PipelineContext[] = [];

    for (const pipeline of pipelines) {
      const lifecycle = LifecycleBuilder.buildLifecycle(pipeline);
      contexts.push({
        framework: pipeline.framework,
        routePath: pipeline.path,
        httpMethod: pipeline.method,
        pipeline,
        lifecycle
      });
    }

    return new FrameworkSemanticModel(pipelines, contexts);
  }

  public getExecutionPipeline(
    handlerNode: NovoNode,
    model: FrameworkSemanticModel
  ): RequestExecutionPipeline | undefined {
    return model.getPipeline(handlerNode);
  }

  public getLifecycle(pipeline: RequestExecutionPipeline): RequestLifecycle {
    return LifecycleBuilder.buildLifecycle(pipeline);
  }

  public getRouteOwner(
    handlerNode: NovoNode,
    model: FrameworkSemanticModel
  ): NovoNode | undefined {
    const pipeline = model.getPipeline(handlerNode);
    return pipeline?.routerNode;
  }

  public getController(
    handlerNode: NovoNode,
    model: FrameworkSemanticModel
  ): NovoNode | undefined {
    const pipeline = model.getPipeline(handlerNode);
    return pipeline?.controllerNode;
  }

  public getMiddlewareChain(
    handlerNode: NovoNode,
    model: FrameworkSemanticModel
  ): MiddlewareComponent[] {
    const pipeline = model.getPipeline(handlerNode);
    if (!pipeline) return [];
    return [...pipeline.preMiddleware, ...pipeline.postMiddleware];
  }

  public getGuards(
    handlerNode: NovoNode,
    model: FrameworkSemanticModel
  ): MiddlewareComponent[] {
    const pipeline = model.getPipeline(handlerNode);
    if (!pipeline) return [];
    return pipeline.preMiddleware.filter(m => m.kind === 'Guard');
  }

  public getInterceptors(
    handlerNode: NovoNode,
    model: FrameworkSemanticModel
  ): MiddlewareComponent[] {
    const pipeline = model.getPipeline(handlerNode);
    if (!pipeline) return [];
    return [
      ...pipeline.preMiddleware.filter(m => m.kind === 'Interceptor'),
      ...pipeline.postMiddleware.filter(m => m.kind === 'Interceptor')
    ];
  }

  public getPipes(
    handlerNode: NovoNode,
    model: FrameworkSemanticModel
  ): MiddlewareComponent[] {
    const pipeline = model.getPipeline(handlerNode);
    if (!pipeline) return [];
    return [...pipeline.pipes];
  }
}
