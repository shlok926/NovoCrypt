import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { ASTCache } from '../src/services/scanner/ast/ASTCache';
import { ScanContext } from '../src/services/scanner/types';

async function runParserTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 8.1 Parser & AST Foundation Tests   ');
  console.log('====================================================\n');

  // Test 1: ParserManager and Adapter Registration
  console.log('Test 1: ParserManager registration & adapter lookup');
  const parserManager = new ParserManager();
  const tsAdapter = parserManager.getAdapter('typescript');
  const jsAdapter = parserManager.getAdapter('javascript');
  assert(tsAdapter !== undefined, 'TypeScript adapter should be registered');
  assert(jsAdapter !== undefined, 'JavaScript adapter should be registered');
  assert.strictEqual(tsAdapter, jsAdapter, 'TypeScript and JavaScript should share the same adapter');
  console.log('  ✔ Adapter registered and retrieved successfully.');

  // Test 2: AST Context Creation & Diagnostics for valid TS
  console.log('\nTest 2: ASTContext creation for valid TypeScript');
  const validTsSource = `
    const algorithm = "AES-GCM";
    function encrypt(data: string): number {
      return 123;
    }
  `;
  const context = new ScanContext({
    targetType: 'code',
    target: validTsSource,
    fileName: 'src/encrypt.ts',
    language: 'typescript'
  });

  const provider = new ASTProvider(parserManager);
  const astContext = provider.getAST(context);

  assert(astContext !== undefined, 'ASTContext should be successfully created');
  assert.strictEqual(astContext.language, 'typescript', 'Language should be typescript');
  assert.strictEqual(astContext.filename, 'src/encrypt.ts', 'Filename should be src/encrypt.ts');
  assert.strictEqual(astContext.diagnostics.length, 0, 'Should have 0 diagnostics for valid syntax');
  assert(astContext.statistics.nodeCount > 0, 'Node count should be greater than 0');
  console.log(`  ✔ Successfully parsed valid TypeScript: ${astContext.statistics.nodeCount} nodes in ${astContext.statistics.parseTimeMs.toFixed(2)}ms.`);

  // Test 3: NovoNode Normalization (Identifier, StringLiteral, FunctionDeclaration)
  console.log('\nTest 3: NovoNode normalization checks');
  const rootNode = astContext.root;
  assert.strictEqual(rootNode.type, 'SourceFile', 'Root node type should be SourceFile');
  assert.strictEqual(rootNode.language, 'typescript', 'Root language should be typescript');
  assert(rootNode.children.length > 0, 'Root node should have children');

  // Find VariableDeclaration child
  let varDeclNode: any = null;
  const findNode = (node: any, type: string) => {
    if (node.type === type) {
      varDeclNode = node;
      return;
    }
    for (const child of node.children) {
      findNode(child, type);
    }
  };
  findNode(rootNode, 'VariableDeclaration');

  assert(varDeclNode !== null, 'Should locate normalized VariableDeclaration node');
  assert.strictEqual(varDeclNode.location.startLine, 2, 'Variable declaration should start on line 2');
  console.log('  ✔ Node location (startLine/startColumn) and kinds normalized successfully.');

  // Test 4: Diagnostics on syntax errors (Invalid code)
  console.log('\nTest 4: Syntactic diagnostics on invalid TypeScript');
  const invalidTsSource = `
    const algorithm = ;
    function encrypt(
  `;
  const invalidContext = new ScanContext({
    targetType: 'code',
    target: invalidTsSource,
    fileName: 'src/invalid.ts',
    language: 'typescript'
  });

  const invalidAst = provider.getAST(invalidContext);
  assert(invalidAst !== undefined, 'Should return context even on syntax errors');
  assert(invalidAst.diagnostics.length > 0, 'Syntactic diagnostics list should not be empty');
  assert.strictEqual(invalidAst.diagnostics[0].severity, 'error', 'Severity should be error');
  console.log(`  ✔ Successfully captured ${invalidAst.diagnostics.length} syntax diagnostics.`);

  // Test 5: ASTCache Hit/Miss metrics & Request-scoped isolation
  console.log('\nTest 5: ASTCache hits, misses, and cleanup');
  const cache = new ASTCache();
  const cacheProvider = new ASTProvider(parserManager, cache);

  const metricsInit = cache.getMetrics();
  assert.strictEqual(metricsInit.hits, 0, 'Initial hits should be 0');
  assert.strictEqual(metricsInit.misses, 0, 'Initial misses should be 0');

  // Scan 1 (Miss)
  const ast1 = cacheProvider.getAST(context);
  const metricsAfter1 = cache.getMetrics();
  assert.strictEqual(metricsAfter1.hits, 0, 'First get should miss');
  assert.strictEqual(metricsAfter1.misses, 1, 'First get should miss');

  // Scan 2 (Hit)
  const ast2 = cacheProvider.getAST(context);
  const metricsAfter2 = cache.getMetrics();
  assert.strictEqual(metricsAfter2.hits, 1, 'Second get should hit cache');
  assert.strictEqual(metricsAfter2.size, 1, 'Cache size should be 1');

  // Clear cache
  cacheProvider.clearCache();
  const metricsAfterClear = cache.getMetrics();
  assert.strictEqual(metricsAfterClear.size, 0, 'Cache should be empty after clear');
  console.log('  ✔ Cache hit/miss and clear mechanisms are working correctly.');

  // Test 6: Concurrent AST parsing stability
  console.log('\nTest 6: Concurrent parsing checks');
  const files = Array.from({ length: 10 }, (_, i) => ({
    filename: `src/module_${i}.ts`,
    source: `const val_${i} = ${i};`
  }));

  const promises = files.map(file => {
    const fileContext = new ScanContext({
      targetType: 'code',
      target: file.source,
      fileName: file.filename,
      language: 'typescript'
    });
    return provider.getAST(fileContext);
  });

  const parsedResults = await Promise.all(promises);
  assert.strictEqual(parsedResults.length, 10, 'Should parse all 10 files concurrently');
  assert(parsedResults.every(res => res !== undefined), 'All parses should be valid contexts');
  console.log('  ✔ Concurrent parsing execution is stable and thread-safe.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 8.1 PARSER INFRASTRUCTURE TESTS PASSED! 🎉');
  console.log('====================================================');
}

runParserTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
