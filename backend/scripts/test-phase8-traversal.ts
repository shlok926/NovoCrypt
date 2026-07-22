import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { IASTVisitor } from '../src/services/scanner/ast/IASTVisitor';
import { TraversalContext } from '../src/services/scanner/ast/TraversalContext';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';
import { ScanContext } from '../src/services/scanner/types';

async function runTraversalTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 8.2 AST Traversal & Visitor Tests  ');
  console.log('====================================================\n');

  const parserManager = new ParserManager();
  const provider = new ASTProvider(parserManager);

  const source = `
    const a = 1;
    function calculate() {
      const b = 2;
      return b;
    }
  `;

  const context = new ScanContext({
    targetType: 'code',
    target: source,
    fileName: 'src/math.ts',
    language: 'typescript'
  });

  const astContext = provider.getAST(context)!;

  // Test 1: Depth-First Traversal & Ordering (Pre-order vs Post-order)
  console.log('Test 1: Traversal pre-order and post-order execution sequence');
  const sequence: string[] = [];
  const seqVisitor: IASTVisitor = {
    id: 'seq-visitor',
    enterNode(node, ctx) {
      sequence.push(`enter-${node.type}`);
    },
    leaveNode(node, ctx) {
      sequence.push(`leave-${node.type}`);
    }
  };

  const engine = new TraversalEngine();
  engine.registerVisitor(seqVisitor);
  const metrics = engine.traverse(astContext);

  assert(metrics.nodesVisited > 0, 'Visited nodes count should be > 0');
  assert.strictEqual(sequence[0], 'enter-SourceFile', 'DFS first enter should be SourceFile');
  assert.strictEqual(sequence[sequence.length - 1], 'leave-SourceFile', 'DFS final leave should be SourceFile');
  console.log(`  ✔ Depth-first walking order verified. Total visited nodes: ${metrics.nodesVisited}.`);

  // Test 2: Lifecycle callbacks & visitor metadata sharing
  console.log('\nTest 2: Lifecycle hooks execution & metadata propagation');
  let beforeFired = false;
  let afterFired = false;
  
  const lifecycleVisitor: IASTVisitor = {
    id: 'lifecycle-visitor',
    beforeTraversal(ctx) {
      beforeFired = true;
      ctx.visitorMetadata.set('init_val', 42);
    },
    enterNode(node, ctx) {
      assert.strictEqual(ctx.visitorMetadata.get('init_val'), 42, 'Metadata should propagate to nodes');
    },
    afterTraversal(ctx) {
      afterFired = true;
    }
  };

  engine.clearVisitors();
  engine.registerVisitor(lifecycleVisitor);
  engine.traverse(astContext);

  assert(beforeFired, 'beforeTraversal lifecycle hook should fire');
  assert(afterFired, 'afterTraversal lifecycle hook should fire');
  console.log('  ✔ beforeTraversal, enterNode, and afterTraversal hooks executed with correct metadata sharing.');

  // Test 3: Visitor Registry (Register, duplicate check, unregister)
  console.log('\nTest 3: Visitor Registry verification');
  engine.clearVisitors();
  const v1: IASTVisitor = { id: 'visitor-1' };
  const v2: IASTVisitor = { id: 'visitor-2' };
  engine.registerVisitor(v1);
  engine.registerVisitor(v2);
  assert.strictEqual(engine.getVisitors().length, 2, 'Should register 2 visitors');

  // Duplicate check
  try {
    engine.registerVisitor(v1);
    assert.fail('Should fail to register duplicate visitor ID');
  } catch (err: any) {
    assert(err.message.includes('already registered'), 'Should throw duplicate registration error');
  }

  // Unregister
  const removed = engine.unregisterVisitor('visitor-1');
  assert(removed, 'Should return true when removing registered visitor');
  assert.strictEqual(engine.getVisitors().length, 1, 'Registry should hold 1 visitor after removal');
  console.log('  ✔ Registry correctly isolates visitors, blocks duplicates, and supports safe dynamic removal.');

  // Test 4: Node type filtering logic
  console.log('\nTest 4: Node type filtering efficiency');
  let identifierCount = 0;
  let skippedCount = 0;
  
  const filterVisitor: IASTVisitor = {
    id: 'filter-visitor',
    nodeTypes: ['Identifier'],
    enterNode(node, ctx) {
      assert.strictEqual(node.type, 'Identifier', 'Filtered visitor should only receive Identifier nodes');
      identifierCount++;
    }
  };

  engine.clearVisitors();
  engine.registerVisitor(filterVisitor);
  const filterMetrics = engine.traverse(astContext);

  assert(identifierCount > 0, 'Should visit some Identifier nodes');
  assert(filterMetrics.nodesSkipped > 0, 'TraversalEngine should record skipped nodes for non-Identifier types');
  console.log(`  ✔ Visited ${identifierCount} identifiers and skipped ${filterMetrics.nodesSkipped} irrelevant nodes.`);

  // Test 5: Early termination (visitor-requested stop)
  console.log('\nTest 5: Early termination (visitor-requested stop)');
  let traversedAfterStop = false;
  const stopVisitor: IASTVisitor = {
    id: 'stop-visitor',
    enterNode(node, ctx) {
      if (node.type === 'VariableDeclaration') {
        ctx.requestStop();
        return;
      }
      if (ctx.isStopRequested()) {
        traversedAfterStop = true;
      }
    }
  };

  engine.clearVisitors();
  engine.registerVisitor(stopVisitor);
  const stopMetrics = engine.traverse(astContext);

  assert(stopMetrics.earlyExit, 'earlyExit flag in metrics should be true');
  assert(!traversedAfterStop, 'Should not execute visitor callbacks after stop is requested');
  console.log('  ✔ Traversal shuts down gracefully and immediately when visitor requests stop.');

  // Test 6: Traversal constraints (Max depth limit & Max node limit)
  console.log('\nTest 6: Traversal limits enforcement');
  const depthLimitedEngine = new TraversalEngine({ maxDepthLimit: 2 });
  const nodeLimitedEngine = new TraversalEngine({ maxNodeLimit: 5 });

  depthLimitedEngine.registerVisitor({ id: 'dummy-v1' });
  nodeLimitedEngine.registerVisitor({ id: 'dummy-v2' });

  const depthMetrics = depthLimitedEngine.traverse(astContext);
  assert(depthMetrics.earlyExit, 'Max depth limit should trigger early exit');
  assert(depthMetrics.maxDepth <= 2, 'Max depth should not exceed limit');

  const nodeMetrics = nodeLimitedEngine.traverse(astContext);
  assert(nodeMetrics.earlyExit, 'Max node limit should trigger early exit');
  assert(nodeMetrics.nodesVisited <= 5, 'Visited nodes should be capped at 5');
  console.log('  ✔ Successfully caps traversal execution using configurable depth and node limits.');

  // Test 7: Error Isolation
  console.log('\nTest 7: Error Isolation under visitor panic');
  let sideVisitorExecuted = false;
  const panicVisitor: IASTVisitor = {
    id: 'panic-visitor',
    enterNode(node, ctx) {
      throw new Error('Panic! Simulated bug inside enterNode.');
    }
  };
  const safeVisitor: IASTVisitor = {
    id: 'safe-visitor',
    enterNode(node, ctx) {
      sideVisitorExecuted = true;
    }
  };

  const isolationEngine = new TraversalEngine({ stopOnError: false });
  isolationEngine.registerVisitor(panicVisitor);
  isolationEngine.registerVisitor(safeVisitor);

  const errorMetrics = isolationEngine.traverse(astContext);
  assert(errorMetrics.errorCount > 0, 'Error count should be captured in metrics');
  assert(sideVisitorExecuted, 'Safe visitor should still execute successfully');
  console.log(`  ✔ Isolated ${errorMetrics.errorCount} visitor exceptions without aborting traversal for other visitors.`);

  console.log('\n====================================================');
  console.log(' ALL PHASE 8.2 TRAVERSAL ENGINE TESTS PASSED! 🎉    ');
  console.log('====================================================');
}

runTraversalTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
