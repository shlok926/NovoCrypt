import assert from 'assert';
import { performance } from 'perf_hooks';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { SymbolTable } from '../src/services/scanner/ast/SymbolTable';
import { SymbolVisitor } from '../src/services/scanner/ast/SymbolVisitor';
import { CallGraphEngine } from '../src/services/scanner/ast/callgraph';
import { FrameworkDiscoveryEngine, FrameworkSemanticEngine } from '../src/services/scanner/ast/framework';
import { ScanContext } from '../src/services/scanner/types';

const parserManager = new ParserManager();
const provider = new ASTProvider(parserManager);

function setupSemantic(source: string, filename: string = 'test.ts') {
  const context = new ScanContext({
    targetType: 'code',
    target: source,
    fileName: filename,
    language: 'typescript'
  });

  const ast = provider.getAST(context)!;
  const scopeManager = new ScopeManager();
  const symbolTable = new SymbolTable();

  const scopeVisitor = new ScopeVisitor(scopeManager);
  const symbolVisitor = new SymbolVisitor(scopeManager, symbolTable);

  const traversal = new TraversalEngine();
  traversal.registerVisitor(scopeVisitor);
  traversal.registerVisitor(symbolVisitor);
  traversal.traverse(ast);

  const callGraphEngine = new CallGraphEngine();
  const callGraph = callGraphEngine.buildCallGraph(ast, scopeManager, symbolTable);

  const discoveryEngine = new FrameworkDiscoveryEngine();
  const metadata = discoveryEngine.discoverFramework(ast, scopeManager, symbolTable, callGraph);

  const semanticEngine = new FrameworkSemanticEngine();
  const model = semanticEngine.buildSemanticModel(metadata);

  return { ast, scopeManager, symbolTable, callGraph, semanticEngine, model, metadata };
}

function runSemanticTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 12.2 Framework Semantic Modeling    ');
  console.log('====================================================');

  // Test 1: Express middleware ordering
  console.log('\nTest 1: Express middleware order modeling');
  const source1 = `
    const express = require('express');
    const app = express();
    app.use(globalMiddleware);
    app.get('/route', routeMiddleware, (req, res) => {});
  `;
  const res1 = setupSemantic(source1);
  const pipelines1 = res1.model.pipelines;
  assert(pipelines1.length === 1, 'Should find 1 route execution pipeline');
  
  const pipeline1 = pipelines1[0];
  assert(pipeline1.preMiddleware.length === 2, 'Should find 2 pre-middlewares (1 global, 1 route)');
  assert(pipeline1.preMiddleware[0].id.includes('global'), 'First should be global middleware');
  assert(pipeline1.preMiddleware[1].node.rawReference?.ref.text === 'routeMiddleware', 'Second should be route middleware');

  const lifecycle1 = res1.semanticEngine.getLifecycle(pipeline1);
  assert(lifecycle1.stages.length === 3, 'Should find 3 lifecycle stages: pre1 -> pre2 -> handler');
  assert(lifecycle1.stages[0].kind === 'preHandler');
  assert(lifecycle1.stages[1].kind === 'preHandler');
  assert(lifecycle1.stages[2].kind === 'handler');
  console.log('  ✔ Express sequential middleware pipeline constructed.');

  // Test 2: Fastify hooks and route mapping
  console.log('\nTest 2: Fastify lifecycle hooks');
  const source2 = `
    const fastify = require('fastify')();
    fastify.addHook('onRequest', handleOnRequest);
    fastify.addHook('onSend', handleOnSend);
    fastify.get('/fastify', (request, reply) => {});
  `;
  const res2 = setupSemantic(source2);
  const pipeline2 = res2.model.pipelines[0];
  assert(pipeline2.preMiddleware.length === 1, 'onRequest hook runs before');
  assert(pipeline2.postMiddleware.length === 1, 'onSend hook runs after');

  const lifecycle2 = res2.semanticEngine.getLifecycle(pipeline2);
  assert(lifecycle2.stages[0].kind === 'onRequest', 'First stage is onRequest');
  assert(lifecycle2.stages[1].kind === 'handler', 'Second stage is handler');
  assert(lifecycle2.stages[2].kind === 'onSend', 'Third stage is onSend');
  console.log('  ✔ Fastify lifecycle hooks sorted by chronological order stages.');

  // Test 3: NestJS Guards, Interceptors, Pipes, and Filters
  console.log('\nTest 3: NestJS Decorators execution sequence');
  const source3 = `
    @Controller('user')
    @UseGuards(AuthGuard)
    class UserController {
      @Get('profile')
      @UseInterceptors(LoggingInterceptor)
      @UsePipes(ValidationPipe)
      @UseFilters(HttpExceptionFilter)
      getProfile() {}
    }
  `;
  const res3 = setupSemantic(source3);
  const pipeline3 = res3.model.pipelines[0];
  
  // preMiddleware has: Guard (AuthGuard), Interceptor (LoggingInterceptor pre)
  // pipes has: Pipe (ValidationPipe)
  // postMiddleware has: Interceptor (LoggingInterceptor post), Filter (HttpExceptionFilter)
  assert(pipeline3.preMiddleware.length === 2, 'Guards and pre-interceptors run before');
  assert(pipeline3.pipes.length === 1, 'Pipes validation mapped');
  assert(pipeline3.postMiddleware.length === 2, 'Post-interceptors and exception filters mapped');

  const lifecycle3 = res3.semanticEngine.getLifecycle(pipeline3);
  // Expected stages order: guard -> preHandler (Interceptor pre) -> pipe -> handler -> postHandler (Interceptor post) -> exceptionFilter
  assert(lifecycle3.stages[0].kind === 'guard');
  assert(lifecycle3.stages[1].kind === 'preHandler');
  assert(lifecycle3.stages[2].kind === 'pipe');
  assert(lifecycle3.stages[3].kind === 'handler');
  assert(lifecycle3.stages[4].kind === 'postHandler');
  assert(lifecycle3.stages[5].kind === 'exceptionFilter');
  console.log('  ✔ NestJS decorators sorted by execution priority (Guard ➔ Interceptor ➔ Pipe ➔ Handler ➔ Filter).');

  // Test 4: Koa Onion middleware cascade
  console.log('\nTest 4: Koa Onion middleware cascade');
  const source4 = `
    const Koa = require('koa');
    const app = new Koa();
    app.use(middlewareOne);
    app.use(middlewareTwo);
    const router = new Router();
    router.get('/koa', (ctx) => {});
  `;
  const res4 = setupSemantic(source4);
  const pipeline4 = res4.model.pipelines[0];
  const lifecycle4 = res4.semanticEngine.getLifecycle(pipeline4);

  // Expected Koa Onion Stages: mid1 (in) -> mid2 (in) -> handler -> mid2 (out) -> mid1 (out)
  assert(lifecycle4.stages.length === 5, `Should build 5 onion stages, got ${lifecycle4.stages.length}`);
  assert(lifecycle4.stages[0].kind === 'preHandler' && lifecycle4.stages[0].metadata.get('onionDirection') === 'inbound');
  assert(lifecycle4.stages[1].kind === 'preHandler' && lifecycle4.stages[1].metadata.get('onionDirection') === 'inbound');
  assert(lifecycle4.stages[2].kind === 'handler');
  assert(lifecycle4.stages[3].kind === 'postHandler' && lifecycle4.stages[3].metadata.get('onionDirection') === 'outbound');
  assert(lifecycle4.stages[4].kind === 'postHandler' && lifecycle4.stages[4].metadata.get('onionDirection') === 'outbound');
  console.log('  ✔ Koa Onion static middleware order cascade mapped.');

  // Test 5: Hapi default stages
  console.log('\nTest 5: Hapi default stages');
  const source5 = `
    const Hapi = require('hapi');
    const server = Hapi.server();
    server.route({
      method: 'GET',
      path: '/hapi',
      handler: (request, h) => {}
    });
  `;
  const res5 = setupSemantic(source5);
  const pipeline5 = res5.model.pipelines[0];
  const lifecycle5 = res5.semanticEngine.getLifecycle(pipeline5);
  assert(lifecycle5.stages[0].kind === 'onRequest');
  assert(lifecycle5.stages[1].kind === 'handler');
  assert(lifecycle5.stages[2].kind === 'onResponse');
  console.log('  ✔ Hapi default route stages mapped.');

  // Test 6: Concurrent execution safety
  console.log('\nTest 6: Concurrent execution safety');
  const concurrentRuns = 100;
  const startCon = performance.now();
  const promises = Array.from({ length: concurrentRuns }).map((_, idx) => {
    return Promise.resolve().then(() => {
      const res = setupSemantic(source1, `test-${idx}.ts`);
      assert(res.model.pipelines.length === 1);
    });
  });
  Promise.all(promises).then(() => {
    const elapsedCon = performance.now() - startCon;
    console.log(`  ✔ Completed ${concurrentRuns} concurrent semantic builds in ${elapsedCon.toFixed(2)}ms`);

    // Test 7: Performance benchmark on large generated repositories
    console.log('\nTest 7: Performance benchmark on large generated routing code');
    let largeSource = `const express = require('express');\nconst app = express();\n`;
    for (let i = 0; i < 500; i++) {
      largeSource += `app.get('/route-${i}', (req, res) => {});\n`;
    }
    const startBench = performance.now();
    const resBench = setupSemantic(largeSource, 'large.ts');
    const elapsedBench = performance.now() - startBench;
    assert(resBench.model.pipelines.length === 500);
    console.log(`  ✔ Model and lifecycle pipelines constructed for 500 routes in ${elapsedBench.toFixed(2)}ms`);

    console.log('\n====================================================');
    console.log(' ALL PHASE 12.2 SEMANTIC MODELING TESTS PASSED! 🎉  ');
    console.log('====================================================');
  }).catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

runSemanticTests();
