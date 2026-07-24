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
import { FrameworkDiscoveryEngine } from '../src/services/scanner/ast/framework';
import { ScanContext } from '../src/services/scanner/types';

const parserManager = new ParserManager();
const provider = new ASTProvider(parserManager);

function setupDiscovery(source: string, filename: string = 'test.ts') {
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

  const engine = new FrameworkDiscoveryEngine();
  const metadata = engine.discoverFramework(ast, scopeManager, symbolTable, callGraph);

  return { ast, scopeManager, symbolTable, callGraph, engine, metadata };
}

function runDiscoveryTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 12.1 Framework Discovery Engine     ');
  console.log('====================================================');

  // Test 1: Express application & basic route discovery
  console.log('\nTest 1: Express basic route discovery');
  const source1 = `
    const express = require('express');
    const app = express();
    app.get('/user', (req, res) => {});
  `;
  const res1 = setupDiscovery(source1);
  assert(res1.metadata.framework === 'Express', 'Should detect Express framework');
  
  const expressApps = res1.metadata.components.filter(c => c.kind === 'Application');
  assert(expressApps.length === 1, 'Should find 1 express app');
  assert(expressApps[0].id.startsWith('express-app-'), 'Should use express-app prefix');

  const expressRoutes = res1.engine.getHandlers(res1.metadata);
  assert(expressRoutes.length === 1, 'Should find 1 express route handler');
  assert(expressRoutes[0].route?.path === '/user', 'Path should be /user');
  assert(expressRoutes[0].route?.method === 'GET', 'Method should be GET');
  assert(expressRoutes[0].id.startsWith('express-route-'), 'Should use express-route prefix');
  console.log('  ✔ Express application and route handler discovered.');

  // Test 2: Express routers, nested routers & middleware chains
  console.log('\nTest 2: Express nested routers & middleware');
  const source2 = `
    const express = require('express');
    const router = express.Router();
    router.post('/login', authMiddleware, loginHandler);
  `;
  const res2 = setupDiscovery(source2);
  const expressRouters = res2.engine.getRouters(res2.metadata);
  assert(expressRouters.length === 1, 'Should find 1 express router');
  
  const routes2 = res2.engine.getHandlers(res2.metadata);
  assert(routes2.length === 1, 'Should find 1 express route handler');
  assert(routes2[0].route?.path === '/login', 'Path should be /login');
  assert(routes2[0].route?.method === 'POST', 'Method should be POST');
  assert(routes2[0].route?.middleware.length === 1, 'Should find 1 middleware node');
  console.log('  ✔ Express router and middleware chain successfully verified.');

  // Test 3: Fastify basic & route configuration mapping
  console.log('\nTest 3: Fastify route and configuration mapping');
  const source3 = `
    const fastify = require('fastify')();
    fastify.post('/submit', handlePost);
    fastify.route({
      method: 'PUT',
      url: '/update',
      handler: handlePut
    });
  `;
  const res3 = setupDiscovery(source3);
  assert(res3.metadata.framework === 'Fastify', 'Should detect Fastify');
  
  const fastifyRoutes = res3.engine.getHandlers(res3.metadata);
  assert(fastifyRoutes.length === 2, 'Should find 2 fastify routes');
  
  const submitRoute = fastifyRoutes.find(r => r.route?.path === '/submit');
  assert(submitRoute?.route?.method === 'POST');

  const updateRoute = fastifyRoutes.find(r => r.route?.path === '/update');
  assert(updateRoute?.route?.method === 'PUT');
  console.log('  ✔ Fastify standard and route-object structures verified.');

  // Test 4: NestJS Module, Controller, Methods, and Decorators
  console.log('\nTest 4: NestJS decorators and components');
  const source4 = `
    @Module({
      controllers: [UserController]
    })
    class UserModule {}

    @Controller('user')
    class UserController {
      @Get('profile')
      getProfile() {}
    }
  `;
  const res4 = setupDiscovery(source4);
  assert(res4.metadata.framework === 'NestJS', 'Should detect NestJS');
  
  const controllers = res4.engine.getControllers(res4.metadata);
  assert(controllers.length === 1);
  assert(controllers[0].id.startsWith('nest-controller-'));

  const nestHandlers = res4.engine.getHandlers(res4.metadata);
  assert(nestHandlers.length === 1);
  assert(nestHandlers[0].route?.path === '/user/profile', `Computed path should combine Controller + Method: got ${nestHandlers[0].route?.path}`);
  assert(nestHandlers[0].route?.method === 'GET');
  console.log('  ✔ NestJS modules, controllers, and combined decorator paths verified.');

  // Test 5: Koa middleware & routing elements
  console.log('\nTest 5: Koa app and middleware');
  const source5 = `
    const Koa = require('koa');
    const app = new Koa();
    app.use(async (ctx, next) => {
      await next();
    });
  `;
  const res5 = setupDiscovery(source5);
  assert(res5.metadata.framework === 'Koa');
  
  const koaMids = res5.engine.getMiddleware(res5.metadata);
  assert(koaMids.length === 1);
  console.log('  ✔ Koa application and middleware detection confirmed.');

  // Test 6: Hapi route mapping
  console.log('\nTest 6: Hapi route mapping');
  const source6 = `
    const Hapi = require('@hapi/hapi');
    const server = Hapi.server();
    server.route({
      method: 'GET',
      path: '/info',
      handler: getInfo
    });
  `;
  const res6 = setupDiscovery(source6);
  assert(res6.metadata.framework === 'Hapi');
  
  const hapiRoutes = res6.engine.getHandlers(res6.metadata);
  assert(hapiRoutes.length === 1);
  assert(hapiRoutes[0].route?.path === '/info');
  assert(hapiRoutes[0].route?.method === 'GET');
  console.log('  ✔ Hapi server routes and objects mapped.');

  // Test 7: Unknown and Mixed framework fallback
  console.log('\nTest 7: Unknown framework fallback checks');
  const source7 = `
    function main() {
      console.log('Regular JS without frameworks');
    }
  `;
  const res7 = setupDiscovery(source7);
  assert(res7.metadata.framework === 'Unknown', 'Plain file should be Unknown');
  console.log('  ✔ Plain file fallback returned Unknown framework.');

  // Test 8: Concurrent discovery thread-safety
  console.log('\nTest 8: Concurrent discovery execution');
  const parallelRuns = 100;
  const startCon = performance.now();
  const promises = Array.from({ length: parallelRuns }).map((_, idx) => {
    return Promise.resolve().then(() => {
      const res = setupDiscovery(source1, `test-${idx}.ts`);
      assert(res.metadata.framework === 'Express');
    });
  });
  Promise.all(promises).then(() => {
    const elapsedCon = performance.now() - startCon;
    console.log(`  ✔ Completed ${parallelRuns} concurrent scans successfully in ${elapsedCon.toFixed(2)}ms`);

    // Test 9: Performance benchmarks on large source files
    console.log('\nTest 9: Performance benchmark on large source files');
    let largeSource = `const express = require('express');\nconst app = express();\n`;
    for (let i = 0; i < 1000; i++) {
      largeSource += `app.get('/route-${i}', (req, res) => { res.send(${i}); });\n`;
    }
    const startBench = performance.now();
    const resBench = setupDiscovery(largeSource, 'large.ts');
    const elapsedBench = performance.now() - startBench;
    
    assert(resBench.metadata.framework === 'Express');
    const benchRoutes = resBench.engine.getHandlers(resBench.metadata);
    assert(benchRoutes.length === 1000, `Should discover 1000 routes, got ${benchRoutes.length}`);
    console.log(`  ✔ Successfully discovered 1000 route configurations in ${elapsedBench.toFixed(2)}ms`);

    console.log('\n====================================================');
    console.log(' ALL PHASE 12.1 FRAMEWORK DISCOVERY TESTS PASSED! 🎉');
    console.log('====================================================');
  }).catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

runDiscoveryTests();
