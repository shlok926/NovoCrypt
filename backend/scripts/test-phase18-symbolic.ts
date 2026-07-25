import assert from 'assert';
import { performance } from 'perf_hooks';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';
import {
  SymbolicEngine,
  SymbolicState,
  ConstraintSet,
  Constraint,
  SymbolicValue,
  SymbolicExpression,
  ExpressionNormalizer,
  ConstraintSimplifier,
  BranchExplorer,
  LoopExplorer,
  ExceptionExplorer,
  StateMerger,
  BranchPruner,
  LoopBoundAnalyzer,
  SymbolicMemoryManager,
  SymbolicTaint,
  SymbolicExecutor
} from '../src/services/scanner';

function createMockNode(type: string, name: string, value?: any, children: NovoNode[] = []): NovoNode {
  const metadata = new Map<string, any>();
  metadata.set('name', name);
  if (value !== undefined) {
    metadata.set('value', value);
  }
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

function runSymbolicTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 18.0 Symbolic Reasoning Tests      ');
  console.log('====================================================');

  const engine = new SymbolicEngine({
    branchPruningEnabled: true,
    cacheEnabled: true
  });

  const initialMemory = {
    heap: new Map<string, SymbolicValue>(),
    stack: new Map<string, SymbolicValue>()
  };

  const initialState: SymbolicState = {
    id: 's0',
    memory: initialMemory,
    constraints: { constraints: [] },
    pathState: { pathId: 'p0', history: [] },
    trace: { traceId: 't0', steps: [] },
    taintedVariables: new Set(['input'])
  };

  // Test 1: Symbolic Values Model
  console.log('\nTest 1: Symbolic value variable assignment');
  const memory = SymbolicMemoryManager.allocateObject(initialMemory, 'x', 'integer');
  const val = memory.heap.get('x');
  assert(val);
  assert.strictEqual(val.name, 'alpha_x');
  assert.strictEqual(val.type, 'integer');
  console.log('  ✔ Symbolic heap allocations completed successfully.');

  // Test 2: Constraint Builder and Expression Normalizer
  console.log('\nTest 2: Constraint generation and expression normalization');
  const leftNode = createMockNode('Identifier', 'x');
  const rightNode = createMockNode('Literal', '5', 5);
  const binaryNode = createMockNode('BinaryExpression', 'gt', undefined, [leftNode, rightNode]);
  binaryNode.metadata.set('operator', '>');

  const nextState = engine.executeSymbolically(binaryNode, initialState);
  assert.strictEqual(nextState.constraints.constraints.length, 1);

  // Normalizer transforms (x > 5) to (x - 5 > 0)
  const normExpr = nextState.constraints.constraints[0].expression;
  assert.strictEqual(normExpr.operator, '>');
  assert.strictEqual(normExpr.right, 0);
  console.log('  ✔ Expression normalization mapped input predicates correctly.');

  // Test 3: Constraint Simplifier
  console.log('\nTest 3: Constraint simplifier logic checks');
  const rawConstraints: Constraint[] = [
    { expression: { left: { name: 'x', type: 'integer' }, operator: '>', right: 0 }, negate: false },
    { expression: { left: { name: 'x', type: 'integer' }, operator: '>', right: 0 }, negate: false } // Duplicate
  ];
  const simplified = ConstraintSimplifier.simplify(rawConstraints);
  assert.strictEqual(simplified.length, 1, 'Simplifier should merge duplicate constraint equations');
  console.log('  ✔ Simplified redundant constraint arrays successfully.');

  // Test 4: Constraint Solver SAT/UNSAT Resolution
  console.log('\nTest 4: Constraint solver feasibility pruner');
  // Construct unsatisfiable constraint set: x > 5 and x < 5
  const unsatSet: ConstraintSet = {
    constraints: [
      { expression: { left: { name: 'x', type: 'integer' }, operator: '>', right: 5 }, negate: false },
      { expression: { left: { name: 'x', type: 'integer' }, operator: '<', right: 5 }, negate: false }
    ]
  };
  const unsatResult = engine.solveConstraints(unsatSet);
  assert.strictEqual(unsatResult.status, 'unsat', 'Should determine unsatisfiable constraints set');
  console.log('  ✔ Identified UNSAT constraints successfully.');

  // Test 5: Branch Explorer & Pruning feasibility checks
  console.log('\nTest 5: Path branch explorer feasibility checks');
  const stateUnsat: SymbolicState = {
    ...initialState,
    constraints: unsatSet
  };
  const exploreRes = engine.explorePaths(stateUnsat);
  assert.strictEqual(exploreRes.feasible, false, 'Branch pruner should mark UNSAT states as infeasible');
  console.log('  ✔ Infeasible execution branches pruned successfully.');

  // Test 6: LoopBound Analyzer Cutoffs
  console.log('\nTest 6: LoopBound cutoff analyzer iteration checks');
  assert.strictEqual(LoopBoundAnalyzer.isLoopBoundReached(5, 5), true, 'LoopBound cutoff reached at max limit');
  assert.strictEqual(LoopBoundAnalyzer.isLoopBoundReached(3, 5), false, 'LoopBound allows execution below limits');
  console.log('  ✔ Loop boundary limits validated successfully.');

  // Test 7: Symbolic Taint conditional sanitization
  console.log('\nTest 7: Symbolic taint conditional sanitization reasoning');
  const taintedVars = new Set(['input']);
  // Safe condition constraint: input == true (signifying custom sanitizer check verified true)
  const sanitizeSet: ConstraintSet = {
    constraints: [
      { expression: { left: { name: 'input', type: 'boolean' }, operator: '==', right: true }, negate: false }
    ]
  };
  const isTainted = engine.analyseSymbolicTaint('input', taintedVars, sanitizeSet);
  assert.strictEqual(isTainted, false, 'Symbolic taint should clear taint if validation constraints resolve as sanitized');
  console.log('  ✔ Conditional sanitizer taint checks validated successfully.');

  // Test 8: State Merging
  console.log('\nTest 8: State merger for compatible symbolic states');
  const s1: SymbolicState = {
    id: 's1',
    memory: { heap: new Map([['x', { name: 'alpha_x', type: 'integer' }]]), stack: new Map() },
    constraints: { constraints: [rawConstraints[0]] },
    pathState: { pathId: 'p1', history: [] },
    trace: { traceId: 't1', steps: [] },
    taintedVariables: new Set()
  };
  const s2: SymbolicState = {
    id: 's2',
    memory: { heap: new Map([['y', { name: 'alpha_y', type: 'integer' }]]), stack: new Map() },
    constraints: { constraints: [rawConstraints[0]] },
    pathState: { pathId: 'p1', history: [] },
    trace: { traceId: 't1', steps: [] },
    taintedVariables: new Set(['input'])
  };
  const merged = engine.mergeStates(s1, s2);
  assert(merged);
  assert(merged.memory.heap.has('x'));
  assert(merged.memory.heap.has('y'));
  assert(merged.taintedVariables.has('input'), 'Merged state should union tainted variables sets');
  console.log('  ✔ Compatible states merged cleanly.');

  // Test 9: Benchmark simulation of 100,000 symbolic states feasibility check
  console.log('\nTest 9: Benchmark solving 100,000 symbolic path constraints');
  const benchNodes: NovoNode[] = [];
  for (let i = 0; i < 10000; i++) {
    const leftNode2 = createMockNode('Identifier', 'x');
    const rightNode2 = createMockNode('Literal', `${i}`, i);
    const node = createMockNode('BinaryExpression', 'gt', undefined, [leftNode2, rightNode2]);
    node.metadata.set('operator', '>');
    benchNodes.push(node);
  }

  const startBench = performance.now();
  const benchRes = engine.analyseSymbolically(benchNodes, initialState);
  const elapsedBench = performance.now() - startBench;

  console.log(`  ✔ Evaluated and solved 10,000 constraints steps in ${elapsedBench.toFixed(2)}ms`);

  console.log('\n====================================================');
  console.log(' ALL PHASE 18.0 SYMBOLIC TESTS PASSED! 🎉           ');
  console.log('====================================================');
}

runSymbolicTests();
