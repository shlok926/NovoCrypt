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
import { DataFlowEngine } from '../src/services/scanner/ast/dataflow/DataFlowEngine';
import { FrameworkDiscoveryEngine, FrameworkSemanticEngine, FrameworkSecurityEngine } from '../src/services/scanner/ast/framework';
import { ScanContext } from '../src/services/scanner/types';

const parserManager = new ParserManager();
const provider = new ASTProvider(parserManager);

function setupSecurityRun(source: string, filename: string = 'test.ts') {
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

  const dataFlowEngine = new DataFlowEngine();
  const dataFlow = dataFlowEngine.buildFlowGraph(ast, scopeManager, symbolTable);

  const discoveryEngine = new FrameworkDiscoveryEngine();
  const metadata = discoveryEngine.discoverFramework(ast, scopeManager, symbolTable, callGraph);

  const semanticEngine = new FrameworkSemanticEngine();
  const semanticModel = semanticEngine.buildSemanticModel(metadata);

  const securityEngine = new FrameworkSecurityEngine();
  const result = securityEngine.evaluateSecurity(semanticModel, callGraph, dataFlow, metadata);

  return { ast, scopeManager, symbolTable, callGraph, dataFlow, securityEngine, result, metadata, semanticModel };
}

function runSecurityTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 12.3 Framework Security Rules       ');
  console.log('====================================================');

  // Test 1: Express Authentication & Helmet & Validation
  console.log('\nTest 1: Express Security Rules');
  const source1 = `
    const express = require('express');
    const app = express();
    app.get('/admin/users', (req, res) => {});
  `;
  const res1 = setupSecurityRun(source1);
  const findings1 = res1.result.findings;
  
  assert(findings1.length > 0);
  
  const hasMissingAuth = findings1.some(f => f.ruleId === 'express-missing-auth');
  const hasMissingHelmet = findings1.some(f => f.ruleId === 'express-missing-helmet');
  const hasMissingValidation = findings1.some(f => f.ruleId === 'express-missing-validation');
  
  assert(hasMissingAuth, 'Should flag missing authentication on sensitive path');
  assert(hasMissingHelmet, 'Should flag missing helmet headers protection');
  assert(hasMissingValidation, 'Should flag missing validation on route');

  // Check unique sequenced finding ID formatting
  assert(findings1[0].id.startsWith('finding-0000'), `Should use padded finding prefix, got ${findings1[0].id}`);
  console.log('  ✔ Express missing auth, missing helmet, and missing validation rules triggered.');

  // Test 2: Fastify Schema Validation
  console.log('\nTest 2: Fastify Schema Rules');
  const source2 = `
    const fastify = require('fastify')();
    fastify.get('/items', (req, reply) => {});
  `;
  const res2 = setupSecurityRun(source2);
  const hasMissingSchema = res2.result.findings.some(f => f.ruleId === 'fastify-missing-validation');
  assert(hasMissingSchema, 'Should flag Fastify route without schema validation option');
  console.log('  ✔ Fastify route missing schema rule successfully verified.');

  // Test 3: NestJS Guards, Interceptors, Pipes, Filters
  console.log('\nTest 3: NestJS Decorators Rules');
  const source3 = `
    @Controller('admin/settings')
    class AdminController {
      @Get('key')
      getKey() {}
    }
  `;
  const res3 = setupSecurityRun(source3);
  const findings3 = res3.result.findings;
  
  const hasNestGuard = findings3.some(f => f.ruleId === 'nest-missing-guard');
  const hasNestPipe = findings3.some(f => f.ruleId === 'nest-missing-validation-pipe');
  const hasNestFilter = findings3.some(f => f.ruleId === 'nest-missing-exception-filter');

  assert(hasNestGuard, 'Should flag missing guard on admin path');
  assert(hasNestPipe, 'Should flag missing validation pipe');
  assert(hasNestFilter, 'Should flag missing exception filters');
  console.log('  ✔ NestJS missing guards, validation pipes, and exception filters mapped.');

  // Test 4: Koa middleware ordering issues
  console.log('\nTest 4: Koa Middleware ordering sequence check');
  const source4 = `
    const Koa = require('koa');
    const app = new Koa();
    const router = new Router();
    router.get('/data', handler);
    app.use(router.routes());
    app.use(bodyParser());
  `;
  const res4 = setupSecurityRun(source4);
  const hasKoaOrderError = res4.result.findings.some(f => f.ruleId === 'koa-middleware-ordering');
  assert(hasKoaOrderError, 'Should flag Koa router registered before body parser');
  console.log('  ✔ Koa route registered before parser ordering error triggered.');

  // Test 5: Hapi missing route validation
  console.log('\nTest 5: Hapi validate options rule');
  const source5 = `
    const Hapi = require('hapi');
    const server = Hapi.server();
    server.route({
      method: 'GET',
      path: '/user',
      handler: getProfile
    });
  `;
  const res5 = setupSecurityRun(source5);
  const hasHapiError = res5.result.findings.some(f => f.ruleId === 'hapi-missing-validation');
  assert(hasHapiError, 'Should flag hapi route missing validate option block');
  console.log('  ✔ Hapi parameter validation options missing check confirmed.');

  // Test 6: Concurrent security evaluation safety
  console.log('\nTest 6: Concurrent rules execution safety');
  const concurrentRuns = 100;
  const startCon = performance.now();
  const promises = Array.from({ length: concurrentRuns }).map((_, idx) => {
    return Promise.resolve().then(() => {
      const res = setupSecurityRun(source1, `test-${idx}.ts`);
      assert(res.result.findings.length > 0);
    });
  });
  Promise.all(promises).then(() => {
    const elapsedCon = performance.now() - startCon;
    console.log(`  ✔ Completed ${concurrentRuns} concurrent evaluations in ${elapsedCon.toFixed(2)}ms`);

    // Test 7: Performance benchmark with 500 routes
    console.log('\nTest 7: Performance benchmark with 500 routes');
    let largeSource = `const express = require('express');\nconst app = express();\n`;
    for (let i = 0; i < 500; i++) {
      largeSource += `app.get('/admin/route-${i}', (req, res) => {});\n`;
    }
    const startBench = performance.now();
    const resBench = setupSecurityRun(largeSource, 'large.ts');
    const elapsedBench = performance.now() - startBench;
    
    assert(resBench.result.findings.length > 500); // helmet and auth rule triggers
    console.log(`  ✔ Executed all security rules on 500 routes in ${elapsedBench.toFixed(2)}ms (Metrics: evaluated ${resBench.result.metrics.evaluatedRoutesCount} routes, findings: ${resBench.result.metrics.findingsCount})`);

    console.log('\n====================================================');
    console.log(' ALL PHASE 12.3 FRAMEWORK RULES TESTS PASSED! 🎉    ');
    console.log('====================================================');
  }).catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

runSecurityTests();
