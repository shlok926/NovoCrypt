import assert from 'assert';
import { performance } from 'perf_hooks';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';
import {
  InterproceduralEngine,
  FunctionSummary,
  CallContext,
  AliasSet,
  ObjectState,
  PathCondition,
  CallString,
  RecursionAnalyzer,
  ExceptionAnalyzer,
  FlowMerger
} from '../src/services/scanner';

function createMockNode(type: string, name: string, children: NovoNode[] = []): NovoNode {
  const metadata = new Map<string, any>();
  metadata.set('name', name);
  return {
    type,
    kind: type,
    location: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 10, pos: 0, end: 10 },
    children,
    metadata,
    language: 'typescript',
    rawReference: { ref: {}, kind: 'Identifier' }
  };
}

function runInterproceduralTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 17.0 Interprocedural Engine Tests  ');
  console.log('====================================================');

  const engine = new InterproceduralEngine({
    summaryCacheEnabled: true,
    maxCallDepth: 10
  });

  // Test 1: Function Summaries & Parameter Propagation
  console.log('\nTest 1: Function summary builder and validation checks');
  const paramNode = createMockNode('Parameter', 'userInput');
  const callNode = createMockNode('CallExpression', 'escape');
  
  // Attach call ref expr text for parser matching
  callNode.rawReference = {
    ref: {
      expression: { text: 'escape' }
    },
    kind: 'CallExpression'
  } as any;

  const funcNode = createMockNode('FunctionDeclaration', 'sanitize', [paramNode, callNode]);
  const summaries = engine.buildFunctionSummaries([funcNode]);

  assert.strictEqual(summaries.length, 1);
  assert.strictEqual(summaries[0].id, 'sanitize');
  assert(summaries[0].parameters.includes('userInput'), 'Should extract function parameter');
  assert(summaries[0].calls.includes('escape'), 'Should record call expression details in summary');
  console.log('  ✔ Function summary and dependency calls successfully generated.');

  // Test 2: Call Context & String Stack Depth
  console.log('\nTest 2: CallString stack traversal and contexts');
  const ctx = engine.analyseContexts('src/api/user.ts', 'getUserInfo');
  assert.strictEqual(ctx.callString.toString(), 'global -> getUserInfo');
  assert.strictEqual(ctx.depth, 2);
  console.log('  ✔ Contextual call path mapping validated successfully.');

  // Test 3: Alias references tracking
  console.log('\nTest 3: Alias references copies tracker');
  const lines = [
    'const a = user',
    'const b = a'
  ];
  const aliases = engine.analyseAliases(lines);
  assert.strictEqual(aliases.length, 1);
  assert(aliases[0].variables.includes('a'));
  assert(aliases[0].variables.includes('b'));
  assert(aliases[0].variables.includes('user'));
  console.log('  ✔ Memory alias variables grouped successfully.');

  // Test 4: Object mutation tracking
  console.log('\nTest 4: Object flow field tracking');
  const lines2 = [
    'user.password = input',
    'user.email = val'
  ];
  const objState = engine.analyseObjectFlow(lines2);
  assert.strictEqual(objState.mutationsCount, 2);
  assert.strictEqual(objState.properties.get('user.password'), 'input');
  console.log('  ✔ Property access mutations captured successfully.');

  // Test 5: Path conditions parsing
  console.log('\nTest 5: Path branch constraints analysis');
  const lines3 = [
    'if (user.isAdmin)',
    'while (retryCount < 3)'
  ];
  const pathConds = engine.analysePaths(lines3);
  assert.strictEqual(pathConds.length, 2);
  assert.strictEqual(pathConds[0].predicates[0], 'user.isAdmin');
  assert.strictEqual(pathConds[1].predicates[0], 'retryCount < 3');
  console.log('  ✔ Conditional path predicates extracted successfully.');

  // Test 6: Try/Catch Exceptions flows
  console.log('\nTest 6: Exception analyzer flow checks');
  const lines4 = [
    'try {',
    '  throw new Error("fail");',
    '} catch (err) {}'
  ];
  const flow = ExceptionAnalyzer.analyzeExceptions(lines4);
  assert(flow.throws, 'Should detect throws statement');
  assert.strictEqual(flow.caughtExceptionTypes.length, 1);
  console.log('  ✔ Throws statements and catch blocks identified successfully.');

  // Test 7: Recursion detection & cutoff
  console.log('\nTest 7: Recursion checks and cutoff limiters');
  const stack = ['factorial', 'factorial', 'factorial', 'factorial', 'factorial'];
  const rec1 = RecursionAnalyzer.detectRecursion('factorial', stack, 5);
  assert(rec1.recursive, 'Should detect active recursive loop');
  assert(rec1.cutoff, 'Should reach cutoff limit for recursive depth safety');
  console.log('  ✔ Recursion stack cutoff protection validated successfully.');

  // Test 8: Memory Flow Merger
  console.log('\nTest 8: Flow merging across branches');
  const ms1 = {
    heapObjects: new Map([['x', 10]]),
    aliases: [{ id: 'a1', variables: ['x', 'y'] }],
    objectLifetimes: new Map([['x', 'alive']])
  };
  const ms2 = {
    heapObjects: new Map([['y', 20]]),
    aliases: [{ id: 'a1', variables: ['y', 'z'] }],
    objectLifetimes: new Map([['x', 'escaped']])
  };
  const merged = FlowMerger.merge([ms1, ms2]);
  assert.strictEqual(merged.heapObjects.get('x'), 10);
  assert.strictEqual(merged.heapObjects.get('y'), 20);
  assert.strictEqual(merged.objectLifetimes.get('x'), 'escaped', 'Escaped lifetime state should propagate to merged states');
  console.log('  ✔ Branch states merger completed cleanly.');

  // Test 9: Benchmark simulation of 10,000 function summaries
  console.log('\nTest 9: Benchmark processing 10,000 recursive call nodes');
  engine.getSummaryCache().clear();
  const nodes: NovoNode[] = [];
  for (let i = 0; i < 10000; i++) {
    nodes.push(createMockNode('FunctionDeclaration', `func-${i}`));
  }

  const startBench = performance.now();
  const summariesBench = engine.buildFunctionSummaries(nodes);
  const elapsedBench = performance.now() - startBench;

  assert.strictEqual(summariesBench.length, 10000);
  assert.strictEqual(engine.getSummaryCache().size(), 10000, 'Should load all built summaries into active cache');
  console.log(`  ✔ Synthesized and cached 10,000 summaries in ${elapsedBench.toFixed(2)}ms`);

  console.log('\n====================================================');
  console.log(' ALL PHASE 17.0 INTERPROCEDURAL TESTS PASSED! 🎉    ');
  console.log('====================================================');
}

runInterproceduralTests();
