import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { SymbolTable } from '../src/services/scanner/ast/SymbolTable';
import { SymbolVisitor } from '../src/services/scanner/ast/SymbolVisitor';
import { DataFlowEngine } from '../src/services/scanner/ast/dataflow/DataFlowEngine';
import { TaintEngine } from '../src/services/scanner/ast/taint/TaintEngine';
import { TaintRegistry } from '../src/services/scanner/ast/taint/TaintRules';
import { ScanContext } from '../src/services/scanner/types';

async function runTaintTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 10.0 TaintEngine & Rules Tests     ');
  console.log('====================================================\n');

  const parserManager = new ParserManager();
  const provider = new ASTProvider(parserManager);

  // Source with two independent flows:
  // Flow 1: Tainted source (req.query.key) -> sink (crypto.createCipheriv)
  // Flow 2: Tainted source (process.env.PWD) -> sanitizer (pbkdf2) -> sink (crypto.createCipheriv)
  const source = `
    const userSecret = req.query.key;
    const cipher1 = crypto.createCipheriv("aes-256-gcm", userSecret);

    const envPass = process.env.PWD;
    const derivedKey = pbkdf2(envPass);
    const cipher2 = crypto.createCipheriv("aes-256-gcm", derivedKey);
  `;

  const context = new ScanContext({
    targetType: 'code',
    target: source,
    fileName: 'src/taint-flow.ts',
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

  const taintEngine = new TaintEngine();
  const registry = new TaintRegistry();

  const findings = taintEngine.analyze(graph, registry);

  // Test 1: Identify Sinks and Sources
  console.log('Test 1: Sinks and Sources discovery');
  const sources = taintEngine.findSources(graph, registry);
  const sinks = taintEngine.findSinks(graph, registry);
  assert(sources.length >= 2, 'Should detect at least 2 taint sources');
  assert(sinks.length >= 1, 'Should detect createCipheriv sinks');
  console.log(`  ✔ Successfully discovered ${sources.length} sources and ${sinks.length} sinks.`);

  // Test 2: Flow 1 - Untrusted key parameter reaching cipher sink
  console.log('\nTest 2: Direct propagation from HTTP query to cipheriv sink');
  const directFinding = findings.find(f => f.source.label.includes('req.query') && !f.sanitized);
  assert(directFinding !== undefined, 'Should detect non-sanitized taint path from query to cipheriv');
  assert.strictEqual(directFinding.sink.sinkName, 'crypto.createCipheriv', 'Sink should be matched as cipheriv');
  console.log('  ✔ Direct untrusted path successfully traced and flagged.');

  // Test 3: Flow 2 - Sanitized environment password reaching cipher sink
  console.log('\nTest 3: Sanitizer interruption verification (PBKDF2/scrypt)');
  const sanitizedFinding = findings.find(f => f.source.label.includes('process.env') && f.sanitized);
  assert(sanitizedFinding !== undefined, 'Should detect sanitized path from env variable');
  assert.strictEqual(sanitizedFinding.sanitizer?.sanitizerName, 'Key Derivation PBKDF2/scrypt', 'Sanitizer should be PBKDF2');
  console.log('  ✔ PBKDF2 key derivation sanitizer correctly halted active taint propagation.');

  // Test 4: IsTainted API Check
  console.log('\nTest 4: Node level taint inspection (isTainted)');
  const flowNode = graph.nodes.find(n => n.label === 'userSecret');
  assert(flowNode !== undefined, 'Should find userSecret flow node');
  assert(taintEngine.isTainted(flowNode!, graph, registry), 'userSecret should be marked as tainted');

  const derivedNode = graph.nodes.find(n => n.label === 'derivedKey');
  assert(derivedNode !== undefined, 'Should find derivedKey node');
  // Since derivedKey flows past a sanitizer, it shouldn't carry active taint to flag vulnerability
  assert(!taintEngine.isTainted(derivedNode!, graph, registry), 'derivedKey should NOT be marked as active tainted');
  console.log('  ✔ isTainted returns true on active variables and false on sanitized outputs.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 10.0 TAINTENGINE TESTS PASSED! 🎉        ');
  console.log('====================================================');
}

runTaintTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
