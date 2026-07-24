import { ASTContext } from '../../ASTContext';
import { ScopeManager } from '../../ScopeManager';
import { SymbolTable } from '../../SymbolTable';
import { CallGraph } from '../../callgraph/CallGraph';
import { FrameworkType } from '../models/FrameworkModel';
import { FrameworkMetadata } from '../models/FrameworkMetadata';
import { FrameworkComponent } from '../models/FrameworkComponent';
import { RouteDescriptor } from '../models/RouteDescriptor';
import { FrameworkRegistry } from '../registry/FrameworkRegistry';
import { ExpressPlugin } from '../registry/plugins/ExpressPlugin';
import { FastifyPlugin } from '../registry/plugins/FastifyPlugin';
import { NestPlugin } from '../registry/plugins/NestPlugin';
import { KoaPlugin } from '../registry/plugins/KoaPlugin';
import { HapiPlugin } from '../registry/plugins/HapiPlugin';

export class FrameworkDiscoveryEngine {
  private registry = new FrameworkRegistry();

  constructor() {
    this.registry.registerPlugin(new ExpressPlugin());
    this.registry.registerPlugin(new FastifyPlugin());
    this.registry.registerPlugin(new NestPlugin());
    this.registry.registerPlugin(new KoaPlugin());
    this.registry.registerPlugin(new HapiPlugin());
  }

  public detectFramework(astContext: ASTContext): FrameworkType {
    for (const plugin of this.registry.getPlugins()) {
      if (plugin.detect(astContext)) {
        return plugin.framework;
      }
    }
    return 'Unknown';
  }

  public discoverFramework(
    astContext: ASTContext,
    scopeManager: ScopeManager,
    symbolTable: SymbolTable,
    callGraph: CallGraph
  ): FrameworkMetadata {
    const framework = this.detectFramework(astContext);
    if (framework === 'Unknown') {
      return new FrameworkMetadata({ framework: 'Unknown' });
    }

    const plugin = this.registry.getPlugin(framework)!;
    const result = plugin.discover(astContext, scopeManager, symbolTable, callGraph, this.registry);

    return new FrameworkMetadata({
      framework,
      plugins: [plugin.framework],
      entryPoints: [...result.entryPoints],
      components: [...result.components],
      metadata: new Map(result.metadata)
    });
  }

  public getRoutes(metadata: FrameworkMetadata): RouteDescriptor[] {
    const routes: RouteDescriptor[] = [];
    for (const comp of metadata.components) {
      if (comp.route) {
        routes.push(comp.route);
      }
    }
    return routes;
  }

  public getRouters(metadata: FrameworkMetadata): FrameworkComponent[] {
    return metadata.components.filter(c => c.kind === 'Router');
  }

  public getControllers(metadata: FrameworkMetadata): FrameworkComponent[] {
    return metadata.components.filter(c => c.kind === 'Controller');
  }

  public getMiddleware(metadata: FrameworkMetadata): FrameworkComponent[] {
    return metadata.components.filter(c => c.kind === 'Middleware');
  }

  public getHandlers(metadata: FrameworkMetadata): FrameworkComponent[] {
    return metadata.components.filter(c => c.kind === 'RequestHandler');
  }

  public getEntryPoints(metadata: FrameworkMetadata): FrameworkComponent[] {
    return [...metadata.entryPoints];
  }
}
