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

export class KoaPlugin implements FrameworkPlugin {
  public readonly framework: FrameworkType = 'Koa';
  
  public readonly capabilities: FrameworkPluginCapabilities = {
    routes: true,
    middleware: true,
    nestedRouters: false,
    errorHandlers: true,
    decorators: false
  };

  private componentCounter = 0;

  public detect(astContext: ASTContext): boolean {
    let detected = false;
    const visit = (node: NovoNode) => {
      const native = node.rawReference?.ref as any;
      if (native) {
        if (ts.isIdentifier(native) && (native.text === 'Koa' || native.text.toLowerCase().includes('koa-router') || native.text === 'Router')) {
          detected = true;
        }
        if (ts.isStringLiteral(native) && native.text.toLowerCase().includes('koa')) {
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
      if (native) {
        // 1. const app = new Koa();
        if (ts.isNewExpression(native)) {
          const expr = native.expression;
          if (ts.isIdentifier(expr) && expr.text === 'Koa') {
            const comp: FrameworkComponent = {
              id: `koa-app-${++this.componentCounter}`,
              framework: 'Koa',
              kind: 'Application',
              name: 'KoaApp',
              sourceFile: astContext.filename,
              astNode: node,
              metadata: new Map()
            };
            entryPoints.push(comp);
            components.push(comp);
          }

          // 2. const router = new Router();
          if (ts.isIdentifier(expr) && (expr.text.includes('KoaRouter') || expr.text === 'Router')) {
            const comp: FrameworkComponent = {
              id: `koa-router-${++this.componentCounter}`,
              framework: 'Koa',
              kind: 'Router',
              name: 'KoaRouter',
              sourceFile: astContext.filename,
              astNode: node,
              metadata: new Map()
            };
            components.push(comp);
          }
        }

        // 3. app.use(...) or router.get(...)
        if (ts.isCallExpression(native)) {
          const expr = native.expression;
          if (ts.isPropertyAccessExpression(expr)) {
            const methodName = expr.name.text;

            if (methodName === 'use' && native.arguments.length > 0) {
              const handlerNovo = this.findNovoNode(native.arguments[0], node);
              if (handlerNovo) {
                const comp: FrameworkComponent = {
                  id: `koa-middleware-${++this.componentCounter}`,
                  framework: 'Koa',
                  kind: 'Middleware',
                  name: 'KoaMiddleware',
                  sourceFile: astContext.filename,
                  astNode: node,
                  metadata: new Map()
                };
                components.push(comp);
              }
            }

            if (['get', 'post', 'put', 'delete'].includes(methodName) && native.arguments.length >= 2) {
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
                  id: `koa-route-${++this.componentCounter}`,
                  framework: 'Koa',
                  kind: 'RequestHandler',
                  name: `KoaRoute:${methodName.toUpperCase()}:${path}`,
                  sourceFile: astContext.filename,
                  astNode: node,
                  route,
                  metadata: new Map()
                };
                components.push(comp);
              }
            }
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
