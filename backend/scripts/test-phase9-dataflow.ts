import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { SymbolTable } from '../src/services/scanner/ast/SymbolTable';
import { SymbolVisitor } from '../src/services/scanner/ast/SymbolVisitor';
import { DataFlowEngine } from '../src/services/scanner/ast/dataflow/DataFlowEngine';
import { ScanContext } from '../src/services/scanner/types';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';

async function runDataFlowTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 9.0 DataFlowEngine & Propagation   ');
  console.log('====================================================\n');

  const parserManager = new ParserManager();
  const provider = new ASTProvider(parserManager);

  const source = `
    const initialKey = "secret_key";
    let activeKey = initialKey;
    
    function processKey(keyParam: string) {
      return keyParam;
    }

    const processed = processKey(activeKey);
  `;

  const context = new ScanContext({
    targetType: 'code',
    target: source,
    fileName: 'src/key-flow.ts',
    language: 'typescript'
  });

  const ast = provider.getAST(context)!;
  const scopeManager = new ScopeManager();
  const symbolTable = new SymbolTable();

  const scopeVisitor = new ScopeVisitor(scopeManager);
  const symbolVisitor = new SymbolVisitor(scopeManager, symbolTable);

  const engine = new TraversalEngine();
  engine.registerVisitor(scopeVisitor);
  engine.registerVisitor(symbolVisitor);
  engine.traverse(ast);

  const dfEngine = new DataFlowEngine();
  const graph = dfEngine.buildFlowGraph(ast, scopeManager, symbolTable);

  // Test 1: Node and Edge Counts
  console.log('Test 1: Data-flow graph nodes and edges validation');
  assert(graph.nodes.length > 0, 'Graph should contain flow nodes');
  assert(graph.edges.length > 0, 'Graph should contain propagation edges');
  console.log(`  ✔ Successfully built graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges.`);

  // Test 2: Find Declaration Nodes
  console.log('\nTest 2: Variable Declaration FlowNode verification');
  const declNode = graph.nodes.find(n => n.kind === 'VariableDeclaration' && n.label === 'initialKey');
  assert(declNode !== undefined, 'Should find initialKey declaration node');
  console.log('  ✔ Declaration flow node mapped correctly.');

  // Test 3: Initializer connection
  console.log('\nTest 3: Initializer FlowEdge mapping');
  const initEdges = graph.getIncomingEdges(declNode!.id);
  assert.strictEqual(initEdges.length, 1, 'initialKey should have 1 incoming edge');
  assert.strictEqual(initEdges[0].kind, 'Initializer', 'Incoming edge should be of kind Initializer');
  assert.strictEqual(initEdges[0].source.kind, 'Literal', 'Initializer source should be a Literal');
  console.log('  ✔ Initializer relationship verified.');

  // Test 4: Variable propagation chain tracing (Forward)
  console.log('\nTest 4: Variable assignment chain forward tracing');
  const forwardTraced = dfEngine.traceForward(declNode!, graph);
  assert(forwardTraced.length > 0, 'Forward trace should find consumer nodes');
  
  // Test 5: Forward / Backward tracing
  console.log('\nTest 5: Backward tracking of origins');
  const activeKeyNode = graph.nodes.find(n => n.kind === 'VariableDeclaration' && n.label === 'activeKey');
  assert(activeKeyNode !== undefined, 'Should find activeKey node');
  
  const origins = dfEngine.findOrigins(activeKeyNode!, graph);
  assert(origins.some(o => o.kind === 'Literal' && o.label.includes('secret_key')), 'Origin of activeKey should trace back to "secret_key" Literal');
  console.log('  ✔ Origin trace successfully resolved "activeKey" ➔ "secret_key".');

  // Test 6: Alias tracking
  console.log('\nTest 6: Alias detection API verification');
  const aliases = dfEngine.findAliases(declNode!, graph);
  assert(aliases.some(a => a.label === 'activeKey'), 'initialKey should list activeKey as alias');
  console.log('  ✔ Alias resolution tracked shared storage cells correctly.');

  // Test 7: Interprocedural Call Flow (Function Parameter and Return propagation)
  console.log('\nTest 7: Interprocedural flow checks (Parameters & Returns)');
  const keyParamNode = graph.nodes.find(n => n.kind === 'Parameter' && n.label === 'keyParam');
  assert(keyParamNode !== undefined, 'Should find keyParam Parameter node');
  
  // Forward tracing keyParam should reach return statement and then reach the processed result
  const paramConsumers = dfEngine.findConsumers(keyParamNode!, graph);
  assert(paramConsumers.some(c => c.kind === 'VariableDeclaration' && c.label === 'processed'), 'Consumers of keyParam should include the target processed variable');
  console.log('  ✔ Verified interprocedural arguments and returns mapped correctly.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 9.0 DATAFLOWENGINE TESTS PASSED! 🎉      ');
  console.log('====================================================');
}

runDataFlowTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
