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

export class NestPlugin implements FrameworkPlugin {
  public readonly framework: FrameworkType = 'NestJS';
  
  public readonly capabilities: FrameworkPluginCapabilities = {
    routes: true,
    middleware: false,
    nestedRouters: false,
    errorHandlers: false,
    decorators: true
  };

  private componentCounter = 0;

  public detect(astContext: ASTContext): boolean {
    let detected = false;
    const visit = (node: NovoNode) => {
      const native = node.rawReference?.ref as any;
      if (native) {
        if (ts.isDecorator(native)) {
          const name = this.getDecoratorName(node);
          if (name === 'Controller' || name === 'Module' || name === 'Injectable') {
            detected = true;
          }
        }
        if (ts.isCallExpression(native)) {
          const expr = native.expression;
          if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'NestFactory') {
            detected = true;
          }
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
      if (!native) {
        node.children.forEach(visit);
        return;
      }

      // 1. Controller / Module / Injectable classes
      if (ts.isClassDeclaration(native)) {
        const decorators = node.children.filter(c => c.type === 'Decorator' || c.kind === 'Decorator');
        const controllerDec = decorators.find(d => this.getDecoratorName(d) === 'Controller');
        const moduleDec = decorators.find(d => this.getDecoratorName(d) === 'Module');

        if (controllerDec) {
          const pathPrefix = this.getDecoratorArgument(controllerDec) || '/';
          const controllerName = node.metadata.get('name') || 'NestController';

          const controllerComp: FrameworkComponent = {
            id: `nest-controller-${++this.componentCounter}`,
            framework: 'NestJS',
            kind: 'Controller',
            name: controllerName,
            sourceFile: astContext.filename,
            astNode: node,
            metadata: new Map([['pathPrefix', pathPrefix]])
          };
          components.push(controllerComp);

          // Find request handlers inside the controller class methods
          const methods = node.children.filter(c => c.type === 'MethodDeclaration' || c.kind === 'MethodDeclaration');
          for (const m of methods) {
            const mDecorators = m.children.filter(c => c.type === 'Decorator' || c.kind === 'Decorator');
            const routeDec = mDecorators.find(d => {
              const name = this.getDecoratorName(d);
              return name && ['Get', 'Post', 'Put', 'Delete', 'Patch'].includes(name);
            });

            if (routeDec) {
              const methodName = this.getDecoratorName(routeDec)!;
              const pathSuffix = this.getDecoratorArgument(routeDec) || '';
              const finalPath = this.combinePaths(pathPrefix, pathSuffix);

              const route: RouteDescriptor = {
                path: finalPath,
                method: methodName.toUpperCase(),
                handler: m,
                middleware: [],
                controller: node,
                metadata: new Map()
              };

              const routeComp: FrameworkComponent = {
                id: `nest-route-${++this.componentCounter}`,
                framework: 'NestJS',
                kind: 'RequestHandler',
                name: `NestRoute:${methodName.toUpperCase()}:${finalPath}`,
                sourceFile: astContext.filename,
                astNode: m,
                route,
                parentControllerId: controllerComp.id,
                metadata: new Map()
              };
              components.push(routeComp);
            }
          }
        } else if (moduleDec) {
          const comp: FrameworkComponent = {
            id: `nest-module-${++this.componentCounter}`,
            framework: 'NestJS',
            kind: 'Module',
            name: node.metadata.get('name') || 'NestModule',
            sourceFile: astContext.filename,
            astNode: node,
            metadata: new Map()
          };
          components.push(comp);
        }
      }

      // 2. NestFactory.create bootstrap
      if (ts.isCallExpression(native)) {
        const expr = native.expression;
        if (ts.isPropertyAccessExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === 'NestFactory' && expr.name.text === 'create') {
          const comp: FrameworkComponent = {
            id: `nest-bootstrap-${++this.componentCounter}`,
            framework: 'NestJS',
            kind: 'Bootstrap',
            name: 'NestBootstrap',
            sourceFile: astContext.filename,
            astNode: node,
            metadata: new Map()
          };
          entryPoints.push(comp);
          components.push(comp);
        }
      }

      node.children.forEach(visit);
    };

    visit(astContext.root);

    return { entryPoints, components, metadata: new Map() };
  }

  private getDecoratorName(decoratorNode: NovoNode): string | null {
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

  private getDecoratorArgument(decoratorNode: NovoNode): string | null {
    const native = decoratorNode.rawReference?.ref as any;
    if (!native) return null;
    try {
      const expr = native.expression;
      if (ts.isCallExpression(expr) && expr.arguments.length > 0) {
        const firstArg = expr.arguments[0];
        if (ts.isStringLiteral(firstArg) || ts.isNoSubstitutionTemplateLiteral(firstArg)) {
          return firstArg.text;
        }
      }
    } catch (e) {}
    return null;
  }

  private combinePaths(prefix: string, suffix: string): string {
    let p = prefix.trim();
    let s = suffix.trim();

    if (!p.startsWith('/')) p = '/' + p;
    if (p.endsWith('/')) p = p.slice(0, -1);

    if (s !== '') {
      if (!s.startsWith('/')) s = '/' + s;
    }

    return p + s;
  }
}
