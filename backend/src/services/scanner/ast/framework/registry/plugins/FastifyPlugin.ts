import * as ts from 'typescript';
import { ASTContext } from '../../../ASTContext';
import { ScopeManager } from '../../../ScopeManager';
import { SymbolTable } from '../../../SymbolTable';
import { CallGraph } from '../../../callgraph/CallGraph';
import { FrameworkPlugin, FrameworkPluginCapabilities } from '../FrameworkPlugin';
import { FrameworkType } from '../../models/FrameworkModel';
import { DiscoveryResult } from '../../discovery/DiscoveryResult';
import { FrameworkComponent } from '../../models/FrameworkComponent';
import { RouteDescriptor } from '../../models/RouteDescriptor';
import { NovoNode } from '../../../NovoNode';
import { FrameworkRegistry } from '../FrameworkRegistry';

export class FastifyPlugin implements FrameworkPlugin {
  public readonly framework: FrameworkType = 'Fastify';
  
  public readonly capabilities: FrameworkPluginCapabilities = {
    routes: true,
    middleware: true,
    nestedRouters: false,
    errorHandlers: true,
    decorators: true
  };

  private componentCounter = 0;

  public detect(astContext: ASTContext): boolean {
    let detected = false;
    const visit = (node: NovoNode) => {
      const native = node.rawReference?.ref as any;
      if (native) {
        if (ts.isIdentifier(native) && native.text.toLowerCase().includes('fastify')) {
          detected = true;
        }
        if (ts.isStringLiteral(native) && native.text.toLowerCase().includes('fastify')) {
          detected = true;
        }
      }
      node.children.forEach(visit);
    };
    visit(astContext.root);
    return detected;
  }

  public discover(
    astContext: ASTContext,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable,
    callGraph: CallGraph,
    registry: FrameworkRegistry
  ): DiscoveryResult {
    this.componentCounter = 0;
    const entryPoints: FrameworkComponent[] = [];
    const components: FrameworkComponent[] = [];

    const visit = (node: NovoNode) => {
      const native = node.rawReference?.ref as any;
      if (native && ts.isCallExpression(native)) {
        const expr = native.expression;

        // 1. const app = fastify();
        if (ts.isIdentifier(expr) && expr.text.includes('fastify')) {
          const comp: FrameworkComponent = {
            id: `fastify-app-${++this.componentCounter}`,
            framework: 'Fastify',
            kind: 'Application',
            name: 'FastifyApp',
            sourceFile: astContext.filename,
            astNode: node,
            metadata: new Map()
          };
          entryPoints.push(comp);
          components.push(comp);
        }

        if (ts.isPropertyAccessExpression(expr)) {
          const methodName = expr.name.text;

          // 2. app.get(), app.post(), etc.
          if (['get', 'post', 'put', 'delete', 'patch'].includes(methodName) && native.arguments.length >= 2) {
            const firstArg = native.arguments[0];
            const secondArg = native.arguments[1];
            
            let path = '/';
            if (firstArg && (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg))) {
              path = firstArg.text;
            }

            const handlerNovo = this.findNovoNode(secondArg, node);
            if (handlerNovo) {
              const route: RouteDescriptor = {
                path,
                method: methodName.toUpperCase(),
                handler: handlerNovo,
                middleware: [],
                metadata: new Map()
              };

              const comp: FrameworkComponent = {
                id: `fastify-route-${++this.componentCounter}`,
                framework: 'Fastify',
                kind: 'RequestHandler',
                name: `FastifyRoute:${methodName.toUpperCase()}:${path}`,
                sourceFile: astContext.filename,
                astNode: node,
                route,
                metadata: new Map()
              };
              components.push(comp);
            }
          }

          // 3. app.route({ method, url, handler })
          if (methodName === 'route' && native.arguments.length > 0) {
            const argObj = native.arguments[0];
            if (argObj && ts.isObjectLiteralExpression(argObj)) {
              let path = '/';
              let method = 'GET';
              let handlerNovo: NovoNode | null = null;

              for (const prop of argObj.properties) {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                  const propName = prop.name.text;
                  if (propName === 'url' && (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer))) {
                    path = prop.initializer.text;
                  }
                  if (propName === 'method') {
                    if (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer)) {
                      method = prop.initializer.text;
                    } else if (ts.isArrayLiteralExpression(prop.initializer)) {
                      // e.g. method: ['GET', 'POST']
                      method = prop.initializer.elements.map(e => ts.isStringLiteral(e) ? e.text : '').filter(Boolean).join(',');
                    }
                  }
                  if (propName === 'handler') {
                    handlerNovo = this.findNovoNode(prop.initializer, node);
                  }
                }
              }

              if (handlerNovo) {
                const route: RouteDescriptor = {
                  path,
                  method,
                  handler: handlerNovo,
                  middleware: [],
                  metadata: new Map()
                };

                const comp: FrameworkComponent = {
                  id: `fastify-route-${++this.componentCounter}`,
                  framework: 'Fastify',
                  kind: 'RequestHandler',
                  name: `FastifyRoute:${method}:${path}`,
                  sourceFile: astContext.filename,
                  astNode: node,
                  route,
                  metadata: new Map()
                };
                components.push(comp);
              }
            }
          }

          // 4. app.addHook('onRequest', ...)
          if (methodName === 'addHook' && native.arguments.length >= 2) {
            const hookNameArg = native.arguments[0];
            if (hookNameArg && (ts.isStringLiteral(hookNameArg) || ts.isNoSubstitutionTemplateLiteral(hookNameArg))) {
              const hookName = hookNameArg.text;
              const handlerNovo = this.findNovoNode(native.arguments[1], node);
              if (handlerNovo) {
                const comp: FrameworkComponent = {
                  id: `fastify-hook-${++this.componentCounter}`,
                  framework: 'Fastify',
                  kind: 'Middleware',
                  name: `FastifyHook:${hookName}`,
                  sourceFile: astContext.filename,
                  astNode: node,
                  metadata: new Map([['hookName', hookName]])
                };
                components.push(comp);
              }
            }
          }

          // 5. app.decorateRequest(...) or app.decorate(...)
          if (['decorate', 'decorateRequest', 'decorateReply'].includes(methodName)) {
            const comp: FrameworkComponent = {
              id: `fastify-decorator-${++this.componentCounter}`,
              framework: 'Fastify',
              kind: 'Decorator',
              name: `FastifyDecorator:${methodName}`,
              sourceFile: astContext.filename,
              astNode: node,
              metadata: new Map()
            };
            components.push(comp);
          }
        }
      }
      node.children.forEach(visit);
    };

    visit(astContext.root);

    return { entryPoints, components, metadata: new Map() };
  }

  private findNovoNode(nativeNode: ts.Node, context: NovoNode): NovoNode | null {
    if (context.rawReference?.ref === nativeNode) return context;
    for (const child of context.children) {
      const found = this.findNovoNode(nativeNode, child);
      if (found) return found;
    }
    return null;
  }
}
