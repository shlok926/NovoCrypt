import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { SymbolTable } from '../src/services/scanner/ast/SymbolTable';
import { SymbolVisitor } from '../src/services/scanner/ast/SymbolVisitor';
import { ScanContext } from '../src/services/scanner/types';

async function runSymbolTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 8.4 SymbolTable & Resolution Tests ');
  console.log('====================================================\n');

  const parserManager = new ParserManager();
  const provider = new ASTProvider(parserManager);

  // Source code containing exports, imports, variables, calls, assignments, and shadowing
  const source = `
    import { generateKey } from 'crypto-utils';
    export const globalKey = "AES";
    
    export function runCrypto(paramVal: string) {
      let activeKey = globalKey;
      activeKey = "NEW_VALUE"; // write reference
      
      if (paramVal) {
        const globalKey = "SHADOWED_VAR"; // shadowed variable
        const nestedVal = globalKey; // read shadowed
      }
      return activeKey;
    }
  `;

  const context = new ScanContext({
    targetType: 'code',
    target: source,
    fileName: 'src/crypto-runner.ts',
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

  // Test 1: Symbol creation, imports, and exports
  console.log('Test 1: Import / Export Symbol detection');
  const allSymbols = symbolTable.getAllSymbols();
  assert(allSymbols.length > 0, 'Symbols should be registered');

  const imports = symbolTable.getImports();
  assert.strictEqual(imports.length, 1, 'Should find 1 import symbol (generateKey)');
  assert.strictEqual(imports[0].name, 'generateKey', 'Imported symbol name should match');
  assert.strictEqual(imports[0].kind, 'Import', 'generateKey should have Import kind');

  const exports = symbolTable.getExports();
  // 'globalKey' and 'runCrypto' are exported
  assert.strictEqual(exports.length, 2, 'Should find 2 exported symbols');
  const exportNames = exports.map(s => s.name);
  assert(exportNames.includes('globalKey'), 'Should export globalKey');
  assert(exportNames.includes('runCrypto'), 'Should export runCrypto');
  console.log('  ✔ Import and Export declarations successfully parsed and classified.');

  // Test 2: Lexical Resolution & Shadowing Detection
  console.log('\nTest 2: Lexical Symbol Resolution and Shadowing');
  // Resolve 'globalKey' inside runCrypto vs inside the nested block scope
  const globalKeySymbol = allSymbols.find(s => s.name === 'globalKey' && s.scope.type === 'module')!;
  const shadowedKeySymbol = allSymbols.find(s => s.name === 'globalKey' && s.scope.type === 'block')!;
  
  assert(globalKeySymbol !== undefined, 'Module-level globalKey symbol should exist');
  assert(shadowedKeySymbol !== undefined, 'Block-level shadowed globalKey symbol should exist');
  assert.notStrictEqual(globalKeySymbol.id, shadowedKeySymbol.id, 'Shadowed and global symbol IDs must be unique');
  console.log('  ✔ Shadowed declarations mapped to distinct Symbol definitions.');

  // Test 3: Reference tracking (reads vs writes)
  console.log('\nTest 3: Reference usages (read vs write) tracking');
  const activeKeySymbol = allSymbols.find(s => s.name === 'activeKey')!;
  assert(activeKeySymbol !== undefined, 'activeKey variable symbol should exist');

  const refs = symbolTable.findReferences(activeKeySymbol);
  // Usage 1: let activeKey = globalKey (declaration itself is not a reference, but we trace subsequent references)
  // Usage 2: activeKey = "NEW_VALUE" (write reference)
  // Usage 3: return activeKey (read reference)
  assert.strictEqual(refs.length, 2, 'Should find 2 references to activeKey symbol');
  
  const writeRef = refs.find(r => r.usage === 'write')!;
  const readRef = refs.find(r => r.usage === 'read')!;
  
  assert(writeRef !== undefined, 'Should record write usage');
  assert(readRef !== undefined, 'Should record read usage');
  console.log(`  ✔ Successfully logged ${refs.length} references to activeKey (read: 1, write: 1).`);

  // Test 4: Variable, Parameter, and Function classification
  console.log('\nTest 4: Parameter and function classification checks');
  const paramSymbol = allSymbols.find(s => s.name === 'paramVal')!;
  assert(paramSymbol !== undefined, 'paramVal symbol should exist');
  assert.strictEqual(paramSymbol.kind, 'Parameter', 'paramVal kind should be Parameter');

  const runCryptoSymbol = allSymbols.find(s => s.name === 'runCrypto')!;
  assert(runCryptoSymbol !== undefined, 'runCrypto symbol should exist');
  assert.strictEqual(runCryptoSymbol.kind, 'Function', 'runCrypto kind should be Function');
  console.log('  ✔ Symbol kind parameters successfully mapped.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 8.4 SYMBOLTABLE TESTS PASSED! 🎉         ');
  console.log('====================================================');
}

runSymbolTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
