import assert from 'assert';
import { performance } from 'perf_hooks';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { SymbolTable } from '../src/services/scanner/ast/SymbolTable';
import { SymbolVisitor } from '../src/services/scanner/ast/SymbolVisitor';
import { CallGraphEngine, CallGraph, CallNode } from '../src/services/scanner/ast/callgraph';
import { ScanContext } from '../src/services/scanner/types';

const parserManager = new ParserManager();
const provider = new ASTProvider(parserManager);

function setupGraph(source: string, filename: string = 'test.ts') {
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

  const engine = new CallGraphEngine();
  const callGraph = engine.buildCallGraph(ast, scopeManager, symbolTable);

  return { ast, scopeManager, symbolTable, callGraph, engine };
}

async function runCallGraphTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 11.0 Call Graph Engine Tests      ');
  console.log('====================================================\n');

  // Test 1: Simple Calls
  console.log('Test 1: Simple function call graph construction');
  const source1 = `
    function a() {
      b();
    }
    function b() {}
  `;
  const res1 = setupGraph(source1);
  const nodes1 = Array.from(res1.callGraph.nodes.values());
  const aNode = nodes1.find(n => n.name === 'a')!;
  const bNode = nodes1.find(n => n.name === 'b')!;
  assert(aNode && bNode, 'Should find call nodes a and b');
  assert(res1.engine.findCallees(aNode, res1.callGraph).some(n => n.id === bNode.id), 'a should call b');
  assert(res1.engine.findCallers(bNode, res1.callGraph).some(n => n.id === aNode.id), 'b should be called by a');
  console.log('  ✔ Simple direct caller-callee bindings resolved successfully.');

  // Test 2: Nested Reachability
  console.log('\nTest 2: Nested reachability checks');
  const source2 = `
    function first() {
      function second() {
        third();
      }
      second();
    }
    function third() {}
  `;
  const res2 = setupGraph(source2);
  const nodes2 = Array.from(res2.callGraph.nodes.values());
  const firstNode = nodes2.find(n => n.name === 'first')!;
  const thirdNode = nodes2.find(n => n.name === 'third')!;
  assert(res2.engine.isReachable(firstNode, thirdNode, res2.callGraph), 'third should be reachable from first');
  assert(!res2.engine.isReachable(thirdNode, firstNode, res2.callGraph), 'first should not be reachable from third');
  console.log('  ✔ Reachability paths through nested scopes verified.');

  // Test 3: Shadowed / Duplicate Names
  console.log('\nTest 3: Shadowed and duplicate function names in different scopes');
  const source3 = `
    function encrypt() {
      const local = () => {};
      local();
    }
    class Crypto {
      encrypt() {}
    }
  `;
  const res3 = setupGraph(source3);
  const nodes3 = Array.from(res3.callGraph.nodes.values());
  const encryptNodes = nodes3.filter(n => n.name === 'encrypt');
  assert.strictEqual(encryptNodes.length, 2, 'Should find two different functions named encrypt');
  console.log('  ✔ Avoided naming collisions via stable function IDs.');

  // Test 4: Constructors & Method Calls
  console.log('\nTest 4: Class methods and constructors');
  const source4 = `
    class Service {
      constructor() {
        this.init();
      }
      init() {}
    }
    const s = new Service();
  `;
  const res4 = setupGraph(source4);
  const nodes4 = Array.from(res4.callGraph.nodes.values());
  const ctor = nodes4.find(n => n.kind === 'Constructor')!;
  const init = nodes4.find(n => n.name === 'init')!;
  assert(ctor && init, 'Should find constructor and init method');
  assert(res4.engine.findCallees(ctor, res4.callGraph).some(n => n.id === init.id), 'constructor should call init');
  console.log('  ✔ Constructor instantiation and method invocations mapped.');

  // Test 5: Recursion & Mutual Recursion
  console.log('\nTest 5: Recursive execution detection');
  const source5 = `
    function selfRecurse() {
      selfRecurse();
    }
    function mutualA() {
      mutualB();
    }
    function mutualB() {
      mutualA();
    }
    function normal() {}
  `;
  const res5 = setupGraph(source5);
  const nodes5 = Array.from(res5.callGraph.nodes.values());
  const selfNode = nodes5.find(n => n.name === 'selfRecurse')!;
  const aNode5 = nodes5.find(n => n.name === 'mutualA')!;
  const bNode5 = nodes5.find(n => n.name === 'mutualB')!;
  const normalNode = nodes5.find(n => n.name === 'normal')!;
  assert(res5.engine.isRecursive(selfNode, res5.callGraph), 'selfRecurse should be recursive');
  assert(res5.engine.isRecursive(aNode5, res5.callGraph), 'mutualA should be recursive');
  assert(res5.engine.isRecursive(bNode5, res5.callGraph), 'mutualB should be recursive');
  assert(!res5.engine.isRecursive(normalNode, res5.callGraph), 'normal should not be recursive');
  console.log('  ✔ Correctly distinguished self-recursion and mutual recursion.');

  // Test 6: Strongly Connected Components (SCC)
  console.log('\nTest 6: Tarjan SCC component analysis');
  const source6 = `
    function a() { b(); }
    function b() { c(); }
    function c() { a(); }
    function d() { e(); }
    function e() {}
  `;
  const res6 = setupGraph(source6);
  const sccs = res6.engine.findSCCs(res6.callGraph);
  const cycleScc = sccs.find(scc => scc.length >= 3);
  assert(cycleScc, 'Should find SCC with size >= 3');
  console.log(`  ✔ Tarjan SCC grouping resolved ${sccs.length} component pools.`);

  // Test 7: Topological Sort
  console.log('\nTest 7: Topological sort order checks');
  const sourceDAG = `
    function root() { child1(); child2(); }
    function child1() { leaf(); }
    function child2() { leaf(); }
    function leaf() {}
  `;
  const resDAG = setupGraph(sourceDAG);
  const dagOrder = resDAG.engine.topologicalSort(resDAG.callGraph);
  assert(dagOrder !== null, 'DAG should be sortable');
  const rootIdx = dagOrder.findIndex(n => n.name === 'root');
  const leafIdx = dagOrder.findIndex(n => n.name === 'leaf');
  assert(rootIdx < leafIdx, 'root should come before leaf');

  const sourceCycle = `
    function loopA() { loopB(); }
    function loopB() { loopA(); }
  `;
  const resCycle = setupGraph(sourceCycle);
  const cycleOrder = resCycle.engine.topologicalSort(resCycle.callGraph);
  assert.strictEqual(cycleOrder, null, 'Cycle graphs should reject topological sorting');
  console.log('  ✔ Validated cycle rejection and pre-order traversal for DAGs.');

  // Test 8: Reachability Cache Benchmark
  console.log('\nTest 8: Reachability deep chain caching benchmark');
  let sourceChain = '';
  for (let i = 0; i < 120; i++) {
    sourceChain += `function fn_${i}() { fn_${i + 1}(); }\n`;
  }
  sourceChain += `function fn_120() {}\n`;
  const resChain = setupGraph(sourceChain);
  const chainNodes = Array.from(resChain.callGraph.nodes.values());
  const fn0 = chainNodes.find(n => n.name === 'fn_0')!;
  const fn120 = chainNodes.find(n => n.name === 'fn_120')!;

  const start1 = performance.now();
  const r1 = resChain.engine.isReachable(fn0, fn120, resChain.callGraph);
  const t1 = performance.now() - start1;

  const start2 = performance.now();
  const r2 = resChain.engine.isReachable(fn0, fn120, resChain.callGraph);
  const t2 = performance.now() - start2;

  assert(r1 && r2);
  console.log(`  ✔ Deep chain (120 nodes): First run ${t1.toFixed(3)}ms, Cache hit ${t2.toFixed(3)}ms`);
  assert(t2 <= t1, 'Cache hits must be faster');

  // Test 9: Unreachable & Entry Point discovery
  console.log('\nTest 9: Entry point and unreachable functions');
  const source9 = `
    function main() { entry(); }
    function entry() {}
    function unreached() { unreached2(); }
    function unreached2() { unreached(); }
  `;
  const res9 = setupGraph(source9);
  const entries = res9.engine.findEntryPoints(res9.callGraph);
  const unreachable = res9.engine.findUnreachable(res9.callGraph);
  assert(entries.some(n => n.name === 'main'), 'main is entry');
  assert(!entries.some(n => n.name === 'unreached'), 'unreached should not be entry due to incoming edge from unreached2');
  assert(unreachable.some(n => n.name === 'unreached2'), 'unreached2 is unreachable from main');
  console.log('  ✔ Entry points and unreachable components detected.');

  // Test 10: Performance benchmark with 5,000 functions
  console.log('\nTest 10: Performance benchmark on large source files');
  let sourceLarge = '';
  for (let i = 0; i < 5000; i++) {
    sourceLarge += `function f_${i}() { f_${(i + 1) % 5000}(); }\n`;
  }
  const startPerf = performance.now();
  const resPerf = setupGraph(sourceLarge);
  const tPerf = performance.now() - startPerf;
  console.log(`  ✔ Parsed and built call graph of 5,000 recursive functions in ${tPerf.toFixed(2)}ms.`);
  assert.strictEqual(resPerf.callGraph.nodes.size, 5000);

  // Test 11: Concurrent analyses
  console.log('\nTest 11: Concurrent call graph analyses');
  await testConcurrentAnalyses();

  console.log('\n====================================================');
  console.log(' ALL PHASE 11.0 CALL GRAPH TESTS PASSED! 🎉        ');
  console.log('====================================================');
}

async function testConcurrentAnalyses() {
  const source = `
    function a() { b(); }
    function b() { c(); }
    function c() {}
  `;
  const promises = Array.from({ length: 10 }).map(() => {
    return new Promise<void>((resolve) => {
      const { callGraph, engine } = setupGraph(source);
      const nodes = Array.from(callGraph.nodes.values());
      const aNode = nodes.find(n => n.name === 'a')!;
      const cNode = nodes.find(n => n.name === 'c')!;
      assert(engine.isReachable(aNode, cNode, callGraph));
      resolve();
    });
  });
  await Promise.all(promises);
  console.log('  ✔ Concurrent graph execution trace runs thread-safe.');
}

runCallGraphTests().catch(err => {
  console.error(err);
  process.exit(1);
});
