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

export class HapiPlugin implements FrameworkPlugin {
  public readonly framework: FrameworkType = 'Hapi';
  
  public readonly capabilities: FrameworkPluginCapabilities = {
    routes: true,
    middleware: false,
    nestedRouters: false,
    errorHandlers: false,
    decorators: false
  };

  private componentCounter = 0;

  public detect(astContext: ASTContext): boolean {
    let detected = false;
    const visit = (node: NovoNode) => {
      const native = node.rawReference?.ref as any;
      if (native) {
        if (ts.isIdentifier(native) && native.text === 'Hapi') {
          detected = true;
        }
        if (ts.isStringLiteral(native) && native.text.includes('hapi')) {
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

        // 1. const server = Hapi.server();
        if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'Hapi' && expr.name.text === 'server') {
          const comp: FrameworkComponent = {
            id: `hapi-server-${++this.componentCounter}`,
            framework: 'Hapi',
            kind: 'Application',
            name: 'HapiServer',
            sourceFile: astContext.filename,
            astNode: node,
            metadata: new Map()
          };
          entryPoints.push(comp);
          components.push(comp);
        }

        // 2. server.route({ method, path, handler })
        if (ts.isPropertyAccessExpression(expr) && expr.name.text === 'route' && native.arguments.length > 0) {
          const firstArg = native.arguments[0];
          if (firstArg) {
            if (ts.isObjectLiteralExpression(firstArg)) {
              this.parseAndRegisterRoute(firstArg, node, astContext.filename, components);
            } else if (ts.isArrayLiteralExpression(firstArg)) {
              for (const elem of firstArg.elements) {
                if (ts.isObjectLiteralExpression(elem)) {
                  this.parseAndRegisterRoute(elem, node, astContext.filename, components);
                }
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

  private parseAndRegisterRoute(
    objExpr: ts.ObjectLiteralExpression,
    callNode: NovoNode,
    filename: string,
    components: FrameworkComponent[]
  ): void {
    let path = '/';
    let method = 'GET';
    let handlerNovo: NovoNode | null = null;

    for (const prop of objExpr.properties) {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        const propName = prop.name.text;
        if (propName === 'path' && (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer))) {
          path = prop.initializer.text;
        }
        if (propName === 'method' && (ts.isStringLiteral(prop.initializer) || ts.isNoSubstitutionTemplateLiteral(prop.initializer))) {
          method = prop.initializer.text;
        }
        if (propName === 'handler') {
          handlerNovo = this.findNovoNode(prop.initializer, callNode);
        }
      }
    }

    if (handlerNovo) {
      const route: RouteDescriptor = {
        path,
        method: method.toUpperCase(),
        handler: handlerNovo,
        middleware: [],
        metadata: new Map()
      };

      const comp: FrameworkComponent = {
        id: `hapi-route-${++this.componentCounter}`,
        framework: 'Hapi',
        kind: 'RequestHandler',
        name: `HapiRoute:${method.toUpperCase()}:${path}`,
        sourceFile: filename,
        astNode: handlerNovo,
        route,
        metadata: new Map()
      };
      components.push(comp);
    }
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
