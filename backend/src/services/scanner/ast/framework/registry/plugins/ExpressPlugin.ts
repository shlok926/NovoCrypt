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

export class ExpressPlugin implements FrameworkPlugin {
  public readonly framework: FrameworkType = 'Express';
  
  public readonly capabilities: FrameworkPluginCapabilities = {
    routes: true,
    middleware: true,
    nestedRouters: true,
    errorHandlers: true,
    decorators: false
  };

  private componentCounter = 0;

  public detect(astContext: ASTContext): boolean {
    let detected = false;
    const visit = (node: NovoNode) => {
      const native = node.rawReference?.ref as any;
      if (native) {
        if (ts.isIdentifier(native) && native.text.toLowerCase() === 'express') {
          detected = true;
        }
        if (ts.isStringLiteral(native) && native.text.toLowerCase() === 'express') {
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

        // 1. const app = express();
        if (ts.isIdentifier(expr) && expr.text === 'express') {
          const comp: FrameworkComponent = {
            id: `express-app-${++this.componentCounter}`,
            framework: 'Express',
            kind: 'Application',
            name: 'ExpressApp',
            sourceFile: astContext.filename,
            astNode: node,
            metadata: new Map()
          };
          entryPoints.push(comp);
          components.push(comp);
        }

        // 2. const router = express.Router();
        if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'express' && expr.name.text === 'Router') {
          const comp: FrameworkComponent = {
            id: `express-router-${++this.componentCounter}`,
            framework: 'Express',
            kind: 'Router',
            name: 'ExpressRouter',
            sourceFile: astContext.filename,
            astNode: node,
            metadata: new Map()
          };
          components.push(comp);
        }

        // 3. app.get(), app.post(), router.use(), etc.
        if (ts.isPropertyAccessExpression(expr)) {
          const methodName = expr.name.text;
          const isRouteMethod = ['get', 'post', 'put', 'delete', 'patch', 'use'].includes(methodName);

          if (isRouteMethod && native.arguments.length > 0) {
            let path = '/';
            let argStartIndex = 0;

            const firstArg = native.arguments[0];

            if (firstArg && (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg))) {
              path = firstArg.text;
              argStartIndex = 1;
            }

            const handlerArgs: NovoNode[] = [];
            for (let i = argStartIndex; i < native.arguments.length; i++) {
              const argNovo = this.findNovoNode(native.arguments[i], node);
              if (argNovo) handlerArgs.push(argNovo);
            }

            if (handlerArgs.length > 0) {
              const handler = handlerArgs[handlerArgs.length - 1];
              const middleware = handlerArgs.slice(0, -1);

              const route: RouteDescriptor = {
                path,
                method: methodName.toUpperCase(),
                handler,
                middleware,
                metadata: new Map()
              };

              const comp: FrameworkComponent = {
                id: `express-route-${++this.componentCounter}`,
                framework: 'Express',
                kind: methodName === 'use' ? 'Middleware' : 'RequestHandler',
                name: `ExpressRoute:${methodName.toUpperCase()}:${path}`,
                sourceFile: astContext.filename,
                astNode: node,
                route,
                associatedMiddlewareIds: middleware.map((_, i) => `express-mid-${this.componentCounter}-${i}`),
                metadata: new Map()
              };
              components.push(comp);
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
