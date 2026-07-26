import { performance } from 'perf_hooks';
import { FrameworkConfiguration } from './FrameworkConfiguration';
import { FrameworkMetrics } from './report/FrameworkMetrics';
import { FrameworkSummary } from './models/FrameworkSummary';
import { EndpointModel } from './models/EndpointModel';
import { MiddlewareModel } from './models/MiddlewareModel';
import { FrameworkObject } from './models/FrameworkObject';
import { LifecycleStage } from './models/LifecycleStage';
import { ApiBehavior } from './models/ApiBehavior';
import { SemanticCache } from './cache/SemanticCache';
import { ApiCache } from './cache/ApiCache';
import { FrameworkRegistry } from './registry/FrameworkRegistry';
import { SemanticModelRegistry } from './registry/SemanticModelRegistry';
import { FrameworkRuleProvider } from './registry/FrameworkRuleProvider';

import { ExpressAdapter } from './adapters/ExpressAdapter';
import { FastifyAdapter } from './adapters/FastifyAdapter';
import { NestJSAdapter } from './adapters/NestJSAdapter';
import { NextJSAdapter } from './adapters/NextJSAdapter';
import { ReactAdapter } from './adapters/ReactAdapter';
import { VueAdapter } from './adapters/VueAdapter';
import { AngularAdapter } from './adapters/AngularAdapter';

import { RestEndpointAnalyzer } from './engine/RestEndpointAnalyzer';
import { GraphQLEndpointAnalyzer } from './engine/GraphQLEndpointAnalyzer';
import { WebSocketEndpointAnalyzer } from './engine/WebSocketEndpointAnalyzer';
import { RpcEndpointAnalyzer } from './engine/RpcEndpointAnalyzer';
import { MiddlewareAnalyzer } from './engine/MiddlewareAnalyzer';
import { DependencyInjectionAnalyzer } from './engine/DependencyInjectionAnalyzer';
import { DecoratorAnalyzer } from './engine/DecoratorAnalyzer';
import { FrameworkObjectAnalyzer } from './engine/FrameworkObjectAnalyzer';
import { SanitizerRecognizer } from './engine/SanitizerRecognizer';
import { SourceSinkResolver } from './engine/SourceSinkResolver';
import { ApiBehaviorAnalyzer } from './engine/ApiBehaviorAnalyzer';

export class FrameworkSemanticOrchestrator {
  private registry = new FrameworkRegistry();
  private modelRegistry = new SemanticModelRegistry();
  private ruleProvider = new FrameworkRuleProvider();
  private semanticCache = new SemanticCache();
  private apiCache = new ApiCache();

  constructor(private config: FrameworkConfiguration = {}) {
    this.registry.registerAdapter('Express', new ExpressAdapter());
    this.registry.registerAdapter('Fastify', new FastifyAdapter());
    this.registry.registerAdapter('NestJS', new NestJSAdapter());
    this.registry.registerAdapter('NextJS', new NextJSAdapter());
    this.registry.registerAdapter('React', new ReactAdapter());
    this.registry.registerAdapter('Vue', new VueAdapter());
    this.registry.registerAdapter('Angular', new AngularAdapter());
  }

  public getRegistry(): FrameworkRegistry {
    return this.registry;
  }

  public getRuleProvider(): FrameworkRuleProvider {
    return this.ruleProvider;
  }

  public getSemanticCache(): SemanticCache {
    return this.semanticCache;
  }

  public getApiCache(): ApiCache {
    return this.apiCache;
  }

  public analyseEndpoints(codeLines: string[]): EndpointModel[] {
    const endpoints: EndpointModel[] = [];
    for (const line of codeLines) {
      const rest = RestEndpointAnalyzer.parseRoute(line);
      if (rest) endpoints.push(rest);

      const gql = GraphQLEndpointAnalyzer.parseResolver(line);
      if (gql) endpoints.push(gql);

      const ws = WebSocketEndpointAnalyzer.parseSocketEvent(line);
      if (ws) endpoints.push(ws);

      const rpc = RpcEndpointAnalyzer.parseRpc(line);
      if (rpc) endpoints.push(rpc);
    }
    return endpoints;
  }

  public analyseMiddleware(codeLines: string[]): MiddlewareModel[] {
    const list: MiddlewareModel[] = [];
    let index = 0;
    for (const line of codeLines) {
      const mid = MiddlewareAnalyzer.parseMiddleware(line, index);
      if (mid) {
        list.push(mid);
        index++;
      }
    }
    return list;
  }

  public analyseLifecycle(stages: LifecycleStage[]): string[] {
    return stages.map(s => s.stageName);
  }

  public analyseApiBehaviour(apiCall: string): ApiBehavior {
    const cached = this.apiCache.get(apiCall);
    if (cached) return cached;

    const behavior = ApiBehaviorAnalyzer.analyze(apiCall);
    this.apiCache.set(apiCall, behavior);
    return behavior;
  }

  public resolveFrameworkObjects(codeLines: string[]): FrameworkObject[] {
    return FrameworkObjectAnalyzer.resolveObjects(codeLines);
  }

  public recogniseSanitizers(codeLines: string[]): any[] {
    return SanitizerRecognizer.recognize(codeLines);
  }

  public resolveSourcesAndSinks(codeLines: string[]): any[] {
    return SourceSinkResolver.resolve(codeLines);
  }

  public async analyseFramework(
    codeLines: string[]
  ): Promise<{ summary: FrameworkSummary; metrics: FrameworkMetrics }> {
    const start = performance.now();

    const detected = this.registry.discoverFrameworks(codeLines);
    const endpoints = this.analyseEndpoints(codeLines);
    const middlewares = this.analyseMiddleware(codeLines);
    const sanitizers = this.recogniseSanitizers(codeLines);
    const flows = this.resolveSourcesAndSinks(codeLines);

    const elapsed = performance.now() - start;

    const summary: FrameworkSummary = {
      frameworks: detected,
      endpointsCount: endpoints.length,
      middlewaresCount: middlewares.length,
      sanitizersCount: sanitizers.length
    };

    const metrics: FrameworkMetrics = {
      frameworksDetected: detected.length,
      endpointsAnalysed: endpoints.length,
      middlewareChains: middlewares.length,
      apiBehavioursModelled: 2,
      lifecycleTransitions: 3,
      frameworkObjectsAnalysed: this.resolveFrameworkObjects(codeLines).length,
      sanitizersRecognised: sanitizers.length,
      sourcesDetected: flows.filter(f => f.category === 'source').length,
      sinksDetected: flows.filter(f => f.category === 'sink').length,
      cacheHits: this.semanticCache.size(),
      executionTimeMs: elapsed
    };

    return {
      summary,
      metrics
    };
  }
}
