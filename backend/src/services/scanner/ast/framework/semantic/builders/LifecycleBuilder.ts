import { RequestExecutionPipeline } from '../models/RequestExecutionPipeline';
import { RequestLifecycle } from '../models/RequestLifecycle';
import { LifecycleStage } from '../models/LifecycleStage';
import { MiddlewareComponent } from '../models/MiddlewareComponent';

export class LifecycleBuilder {
  public static buildLifecycle(pipeline: RequestExecutionPipeline): RequestLifecycle {
    const stages: LifecycleStage[] = [];
    let order = 0;

    const framework = pipeline.framework;

    if (framework === 'Express') {
      // 1. Pre-middleware execution
      pipeline.preMiddleware.forEach(m => {
        stages.push({
          kind: 'preHandler',
          order: ++order,
          component: m,
          metadata: new Map()
        });
      });
      // 2. Primary Route Handler
      stages.push({
        kind: 'handler',
        order: ++order,
        component: pipeline.handler,
        metadata: new Map()
      });
    } 
    else if (framework === 'Fastify') {
      // Fastify stages based on hook lifecycle stages
      const getHookStageKind = (hookName: string): string => {
        if (hookName === 'onRequest') return 'onRequest';
        if (hookName === 'preValidation') return 'preValidation';
        if (hookName === 'preHandler') return 'preHandler';
        return 'preHandler';
      };

      pipeline.preMiddleware.forEach(m => {
        const hookName = m.metadata.get('hookName') || 'preHandler';
        stages.push({
          kind: getHookStageKind(hookName),
          order: ++order,
          component: m,
          metadata: new Map()
        });
      });

      stages.push({
        kind: 'handler',
        order: ++order,
        component: pipeline.handler,
        metadata: new Map()
      });

      pipeline.postMiddleware.forEach(m => {
        const hookName = m.metadata.get('hookName') || 'onResponse';
        stages.push({
          kind: hookName === 'onSend' ? 'onSend' : 'onResponse',
          order: ++order,
          component: m,
          metadata: new Map()
        });
      });
    } 
    else if (framework === 'NestJS') {
      // NestJS order: Guard -> Interceptor (pre) -> Pipe -> Handler -> Interceptor (post) -> Filter
      const guards = pipeline.preMiddleware.filter(m => m.kind === 'Guard');
      const preInterceptors = pipeline.preMiddleware.filter(m => m.kind === 'Interceptor');
      const postInterceptors = pipeline.postMiddleware.filter(m => m.kind === 'Interceptor');
      const filters = pipeline.postMiddleware.filter(m => m.kind === 'ExceptionFilter');

      guards.forEach(g => {
        stages.push({
          kind: 'guard',
          order: ++order,
          component: g,
          metadata: new Map()
        });
      });

      preInterceptors.forEach(i => {
        stages.push({
          kind: 'preHandler',
          order: ++order,
          component: i,
          metadata: new Map()
        });
      });

      pipeline.pipes.forEach(p => {
        stages.push({
          kind: 'pipe',
          order: ++order,
          component: p,
          metadata: new Map()
        });
      });

      stages.push({
        kind: 'handler',
        order: ++order,
        component: pipeline.handler,
        metadata: new Map()
      });

      postInterceptors.forEach(i => {
        stages.push({
          kind: 'postHandler',
          order: ++order,
          component: i,
          metadata: new Map()
        });
      });

      filters.forEach(f => {
        stages.push({
          kind: 'exceptionFilter',
          order: ++order,
          component: f,
          metadata: new Map()
        });
      });
    } 
    else if (framework === 'Koa') {
      // Koa Onion Model cascade order:
      // Middleware 1 (in) -> Middleware 2 (in) -> Handler -> Middleware 2 (out) -> Middleware 1 (out)
      
      // Inbound middleware phase
      pipeline.preMiddleware.forEach(m => {
        stages.push({
          kind: 'preHandler',
          order: ++order,
          component: m,
          metadata: new Map([['onionDirection', 'inbound']])
        });
      });

      // Handler execution
      stages.push({
        kind: 'handler',
        order: ++order,
        component: pipeline.handler,
        metadata: new Map()
      });

      // Outbound middleware phase (reversed)
      const koaMidsReversed = [...pipeline.preMiddleware].reverse();
      koaMidsReversed.forEach(m => {
        stages.push({
          kind: 'postHandler',
          order: ++order,
          component: m,
          metadata: new Map([['onionDirection', 'outbound']])
        });
      });
    } 
    else {
      // Default / Hapi route lifecycle stages
      stages.push({
        kind: 'onRequest',
        order: ++order,
        metadata: new Map()
      });
      stages.push({
        kind: 'handler',
        order: ++order,
        component: pipeline.handler,
        metadata: new Map()
      });
      stages.push({
        kind: 'onResponse',
        order: ++order,
        metadata: new Map()
      });
    }

    return { stages };
  }
}
