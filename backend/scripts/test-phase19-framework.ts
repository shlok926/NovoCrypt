import assert from 'assert';
import { performance } from 'perf_hooks';
import {
  FrameworkSemanticOrchestrator,
  EndpointModel,
  MiddlewareModel,
  LifecycleStage,
  DependencyInjectionAnalyzer,
  DecoratorAnalyzer
} from '../src/services/scanner';

function runFrameworkTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 19.0 Framework Semantic Tests      ');
  console.log('====================================================');

  const orchestrator = new FrameworkSemanticOrchestrator();

  // Test 1: Framework Detection
  console.log('\nTest 1: Framework auto-detection checks');
  const expressCode = [
    "import express from 'express';",
    "const app = express();"
  ];
  const detectedExpress = orchestrator.getRegistry().discoverFrameworks(expressCode);
  assert(detectedExpress.includes('Express'));

  const reactCode = [
    "import React, { useState } from 'react';"
  ];
  const detectedReact = orchestrator.getRegistry().discoverFrameworks(reactCode);
  assert(detectedReact.includes('React'));

  const nestjsCode = [
    "@Controller('/users')",
    "export class UserController {}"
  ];
  const detectedNest = orchestrator.getRegistry().discoverFrameworks(nestjsCode);
  assert(detectedNest.includes('NestJS'));
  console.log('  ✔ Express, React, and NestJS framework signatures detected.');

  // Test 2: Protocol-Specific Endpoint Analyzers
  console.log('\nTest 2: Protocol-specific endpoint extraction (REST, GraphQL, WS, RPC)');
  const endpointCode = [
    "router.get('/api/v1/users', handler)",
    "Query: { getProfile(parent, args) {} }",
    "socket.on('join_room', (data) => {})",
    "rpc.register('updatePassword', handler)"
  ];
  const endpoints = orchestrator.analyseEndpoints(endpointCode);
  assert.strictEqual(endpoints.length, 4);
  assert.strictEqual(endpoints[0].method, 'GET');
  assert.strictEqual(endpoints[0].route, '/api/v1/users');
  assert.strictEqual(endpoints[1].method, 'GraphQL');
  assert.strictEqual(endpoints[1].route, 'getProfile');
  assert.strictEqual(endpoints[2].method, 'WS_ON');
  assert.strictEqual(endpoints[2].route, 'join_room');
  assert.strictEqual(endpoints[3].method, 'RPC');
  assert.strictEqual(endpoints[3].route, 'updatePassword');
  console.log('  ✔ All protocol-specific endpoints extracted successfully.');

  // Test 3: Middleware execution pipeline
  console.log('\nTest 3: Middleware execution ordering');
  const middlewareCode = [
    "app.use(loggingMiddleware)",
    "app.use(authMiddleware)"
  ];
  const middlewares = orchestrator.analyseMiddleware(middlewareCode);
  assert.strictEqual(middlewares.length, 2);
  assert.strictEqual(middlewares[0].name, 'loggingMiddleware');
  assert.strictEqual(middlewares[0].orderIndex, 0);
  assert.strictEqual(middlewares[1].name, 'authMiddleware');
  assert.strictEqual(middlewares[1].type, 'authentication');
  console.log('  ✔ Middleware order index and validation categories validated.');

  // Test 4: Lifecycle transitions
  console.log('\nTest 4: Framework lifecycles stages');
  const reactStages: LifecycleStage[] = [
    { stageName: 'mount', predecessors: [], successors: ['render'] },
    { stageName: 'render', predecessors: ['mount'], successors: ['unmount'] }
  ];
  const stages = orchestrator.analyseLifecycle(reactStages);
  assert.strictEqual(stages.length, 2);
  assert.strictEqual(stages[0], 'mount');
  assert.strictEqual(stages[1], 'render');
  console.log('  ✔ Framework lifecycle transitions mapped successfully.');

  // Test 5: Decorators parsing (NestJS)
  console.log('\nTest 5: NestJS decorators parsing');
  const nestDecorators = [
    "@Controller('users')",
    "@UseGuards(AuthGuard)"
  ];
  const decs = DecoratorAnalyzer.parseDecorators(nestDecorators);
  assert.strictEqual(decs.length, 2);
  assert.strictEqual(decs[0].decoratorName, 'Controller');
  assert.strictEqual(decs[0].arguments[0], 'users');
  assert.strictEqual(decs[1].decoratorName, 'UseGuards');
  assert.strictEqual(decs[1].arguments[0], 'AuthGuard');
  console.log('  ✔ Controller routing and auth guard decorators parsed.');

  // Test 6: Dependency Injection providers
  console.log('\nTest 6: Dependency injection providers');
  const diCode = [
    "constructor(private readonly userService: UserService, public readonly auth: AuthService) {}"
  ];
  const providers = DependencyInjectionAnalyzer.resolveProviders(diCode);
  assert.strictEqual(providers.length, 2);
  assert.strictEqual(providers[0], 'UserService');
  assert.strictEqual(providers[1], 'AuthService');
  console.log('  ✔ Injected class providers resolved successfully.');

  // Test 7: Sanitizers recognition
  console.log('\nTest 7: Sanitizers recognition (DOMPurify, ValidationPipe)');
  const sanitizerCode = [
    "const clean = DOMPurify.sanitize(input);",
    "app.useGlobalPipes(new ValidationPipe());"
  ];
  const sanitizers = orchestrator.recogniseSanitizers(sanitizerCode);
  assert.strictEqual(sanitizers.length, 2);
  assert.strictEqual(sanitizers[0].name, 'sanitize');
  assert.strictEqual(sanitizers[0].library, 'dompurify');
  assert.strictEqual(sanitizers[1].name, 'ValidationPipe');
  console.log('  ✔ Validation pipe and sanitization methods matched.');

  // Test 8: Source & Sink resolution
  console.log('\nTest 8: Source and sink resolution checks');
  const flowCode = [
    "const query = req.query.name;",
    "db.query(query);"
  ];
  const flows = orchestrator.resolveSourcesAndSinks(flowCode);
  assert.strictEqual(flows.length, 2);
  assert.strictEqual(flows[0].category, 'source');
  assert.strictEqual(flows[1].category, 'sink');
  console.log('  ✔ Inbound request sources and SQL database sinks mapped.');

  // Test 9: Framework security rules checks
  console.log('\nTest 9: Framework rule provider validates Helmet middleware');
  const safeExpressCode = [
    "app.use(helmet());"
  ];
  const unsafeExpressCode = [
    "app.use(cors());"
  ];
  const expressHelmetRule = orchestrator.getRuleProvider().getRules()[0];
  assert.strictEqual(expressHelmetRule.validate(safeExpressCode), true, 'Helmet check should pass');
  assert.strictEqual(expressHelmetRule.validate(unsafeExpressCode), false, 'Helmet check should fail if missing');
  console.log('  ✔ Express security rules evaluated correctly.');

  // Test 10: Benchmark simulation
  console.log('\nTest 10: Benchmark processing 10,000 endpoint routes');
  const benchCode: string[] = [];
  for (let i = 0; i < 10000; i++) {
    benchCode.push(`app.get('/users/${i}', handler)`);
  }

  const startBench = performance.now();
  const benchRes = orchestrator.analyseEndpoints(benchCode);
  const elapsedBench = performance.now() - startBench;

  assert.strictEqual(benchRes.length, 10000);
  console.log(`  ✔ Extracted 10,000 REST routes in ${elapsedBench.toFixed(2)}ms`);

  console.log('\n====================================================');
  console.log(' ALL PHASE 19.0 FRAMEWORK TESTS PASSED! 🎉          ');
  console.log('====================================================');
}

runFrameworkTests();
