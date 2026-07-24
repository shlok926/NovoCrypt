import { FrameworkMetadata } from '../../models/FrameworkMetadata';
import { FrameworkComponent } from '../../models/FrameworkComponent';
import { RequestExecutionPipeline } from '../models/RequestExecutionPipeline';
import { MiddlewareComponent, MiddlewareKind } from '../models/MiddlewareComponent';
import { NovoNode } from '../../../NovoNode';
import * as ts from 'typescript';

export class PipelineBuilder {
  public static buildPipelines(metadata: FrameworkMetadata): RequestExecutionPipeline[] {
    const pipelines: RequestExecutionPipeline[] = [];
    const handlers = metadata.components.filter(c => c.kind === 'RequestHandler');

    for (const h of handlers) {
      if (!h.route) continue;

      let preMiddleware: MiddlewareComponent[] = [];
      let postMiddleware: MiddlewareComponent[] = [];
      let pipes: MiddlewareComponent[] = [];
      let controllerNode: NovoNode | undefined;
      let routerNode: NovoNode | undefined;

      const framework = h.framework;

      // 1. Resolve parent controller / router references
      if (h.parentControllerId) {
        const controllerComp = metadata.components.find(c => c.id === h.parentControllerId);
        if (controllerComp) controllerNode = controllerComp.astNode;
      }
      if (h.parentRouterId) {
        const routerComp = metadata.components.find(c => c.id === h.parentRouterId);
        if (routerComp) routerNode = routerComp.astNode;
      }

      // 2. Framework-specific pipeline building
      if (framework === 'Express') {
        // Map path/route middleware
        if (h.route.middleware) {
          h.route.middleware.forEach((mNode, idx) => {
            preMiddleware.push({
              id: `${h.id}-mid-${idx}`,
              kind: 'Middleware',
              node: mNode,
              order: idx,
              metadata: new Map()
            });
          });
        }
        // Map global middleware
        const globalMids = metadata.components.filter(c => c.kind === 'Middleware' && c.id !== h.id);
        globalMids.forEach((gm, idx) => {
          preMiddleware.unshift({
            id: `express-global-mid-${idx}`,
            kind: 'Middleware',
            node: gm.astNode,
            order: -100 + idx,
            metadata: new Map()
          });
        });
      } 
      else if (framework === 'Fastify') {
        // Find fastify hooks in components
        const hooks = metadata.components.filter(c => c.kind === 'Middleware' && c.metadata.has('hookName'));
        hooks.forEach((hookComp, idx) => {
          const hookName = hookComp.metadata.get('hookName') || '';
          const isPre = ['onRequest', 'preParsing', 'preValidation', 'preHandler'].includes(hookName);
          
          const midComp: MiddlewareComponent = {
            id: `${h.id}-hook-${idx}`,
            kind: 'Middleware',
            node: hookComp.astNode,
            order: idx,
            metadata: new Map([['hookName', hookName]])
          };

          if (isPre) {
            preMiddleware.push(midComp);
          } else {
            postMiddleware.push(midComp);
          }
        });
      } 
      else if (framework === 'NestJS') {
        let decoratorOrder = 0;

        // Helper to extract middleware from decorators
        const extractFromDecorators = (node: NovoNode) => {
          const decorators = node.children.filter(c => c.type === 'Decorator' || c.kind === 'Decorator');
          
          for (const dec of decorators) {
            const decName = this.getDecoratorName(dec);
            if (!decName) continue;

            if (decName === 'UseGuards') {
              preMiddleware.push({
                id: `${h.id}-guard-${++decoratorOrder}`,
                kind: 'Guard',
                node: dec,
                order: decoratorOrder,
                metadata: new Map()
              });
            }
            if (decName === 'UseInterceptors') {
              preMiddleware.push({
                id: `${h.id}-interceptor-pre-${++decoratorOrder}`,
                kind: 'Interceptor',
                node: dec,
                order: decoratorOrder,
                metadata: new Map([['phase', 'pre']])
              });
              postMiddleware.push({
                id: `${h.id}-interceptor-post-${decoratorOrder}`,
                kind: 'Interceptor',
                node: dec,
                order: decoratorOrder,
                metadata: new Map([['phase', 'post']])
              });
            }
            if (decName === 'UsePipes') {
              pipes.push({
                id: `${h.id}-pipe-${++decoratorOrder}`,
                kind: 'Pipe',
                node: dec,
                order: decoratorOrder,
                metadata: new Map()
              });
            }
            if (decName === 'UseFilters') {
              postMiddleware.push({
                id: `${h.id}-filter-${++decoratorOrder}`,
                kind: 'ExceptionFilter',
                node: dec,
                order: decoratorOrder,
                metadata: new Map()
              });
            }
          }
        };

        // Class-level and method-level decorators
        if (controllerNode) {
          extractFromDecorators(controllerNode);
        }
        extractFromDecorators(h.astNode);
      } 
      else if (framework === 'Koa') {
        const koaMids = metadata.components.filter(c => c.kind === 'Middleware');
        koaMids.forEach((km, idx) => {
          preMiddleware.push({
            id: `${h.id}-koa-mid-${idx}`,
            kind: 'Middleware',
            node: km.astNode,
            order: idx,
            metadata: new Map()
          });
        });
      } 
      else if (framework === 'Hapi') {
        // Hapi simple lifecycle: no global hooks mapped yet, defaults to handler.
      }

      // Sort pre/post chains by their order index
      preMiddleware.sort((a, b) => a.order - b.order);
      postMiddleware.sort((a, b) => a.order - b.order);

      pipelines.push({
        path: h.route.path,
        method: h.route.method,
        handler: h.route.handler,
        preMiddleware,
        postMiddleware,
        pipes,
        controllerNode,
        routerNode,
        framework
      });
    }

    return pipelines;
  }

  private static getDecoratorName(decoratorNode: NovoNode): string | null {
    const native = decoratorNode.rawReference?.ref as any;
    if (!native) return null;
    try {
      const expr = native.expression;
      if (ts.isCallExpression(expr)) {
        if (ts.isIdentifier(expr.expression)) return expr.expression.text;
      } else if (ts.isIdentifier(expr)) {
        return expr.text;
      }
    } catch (e) {}
    return null;
  }
}
