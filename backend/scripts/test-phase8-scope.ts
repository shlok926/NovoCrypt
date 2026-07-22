import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { ScanContext } from '../src/services/scanner/types';

async function runScopeTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 8.3 ScopeManager & Lexical Tests   ');
  console.log('====================================================\n');

  const parserManager = new ParserManager();
  const provider = new ASTProvider(parserManager);

  // Test 1: Scope Stack push/pop and nested structures
  console.log('Test 1: Scope Stack & Lexical push/pop lifecycle');
  const scopeManager = new ScopeManager();
  
  const gScope = scopeManager.createScope('global');
  scopeManager.pushScope(gScope);
  assert.strictEqual(scopeManager.currentScope(), gScope, 'Current scope should be global');
  assert.strictEqual(scopeManager.rootScope(), gScope, 'Root scope should be global');

  const mScope = scopeManager.createScope('module');
  scopeManager.pushScope(mScope);
  assert.strictEqual(scopeManager.currentScope(), mScope, 'Current scope should be module');
  assert.strictEqual(mScope.parent, gScope, 'Module parent should be global');

  const popped = scopeManager.popScope();
  assert.strictEqual(popped, mScope, 'Popped scope should be module');
  assert.strictEqual(scopeManager.currentScope(), gScope, 'Current scope should revert to global');
  console.log('  ✔ Scope stack pushing, popping, and hierarchy tracking verified.');

  // Test 2: Declaration Registration & Shadowing Detection
  console.log('\nTest 2: Declaration Registration and Shadowing');
  scopeManager.clear();
  
  const global = scopeManager.createScope('global');
  scopeManager.pushScope(global);

  // Mock NovoNode references
  const mockNode1: any = { type: 'VariableDeclaration', children: [], metadata: new Map() };
  const mockNode2: any = { type: 'VariableDeclaration', children: [], metadata: new Map() };
  const mockNode3: any = { type: 'Parameter', children: [], metadata: new Map() };

  // 1. Register global var 'key'
  scopeManager.registerDeclaration('key', 'variable', mockNode1);
  const findGlobal = scopeManager.findDeclarationInCurrentScope('key');
  assert(findGlobal !== undefined, 'Should find key in global scope');
  assert.strictEqual(findGlobal.type, 'variable', 'Global key should be variable type');
  assert.strictEqual(findGlobal.shadowed, false, 'Global declaration is not shadowed');

  // 2. Register nested local var 'key'
  const localScope = scopeManager.createScope('function');
  scopeManager.pushScope(localScope);

  const localDecl = scopeManager.registerDeclaration('key', 'variable', mockNode2);
  assert(localDecl.shadowed, 'Local declaration should flag as shadowed');
  assert.strictEqual(localDecl.shadowedDeclaration, findGlobal, 'Shadowed declaration link should point to global key');
  assert(scopeManager.isShadowed('key'), 'isShadowed check on current scope should return true');

  // 3. Register parameter 'param1'
  scopeManager.registerDeclaration('param1', 'parameter', mockNode3);
  assert.strictEqual(scopeManager.findDeclarationInCurrentScope('param1')?.type, 'parameter', 'Should find parameter declaration');
  console.log('  ✔ Declaration shadowing and scope links resolved correctly.');

  // Test 3: Nested Lookup API (findNearestDeclaration)
  console.log('\nTest 3: Lexical Lookup API checks');
  const innerBlock = scopeManager.createScope('block');
  scopeManager.pushScope(innerBlock);

  const nearestKey = scopeManager.findNearestDeclaration('key');
  assert.strictEqual(nearestKey, localDecl, 'Should locate local function key, not global key');

  const nearestParam = scopeManager.findNearestDeclaration('param1');
  assert(nearestParam !== undefined, 'Should locate parameter from parent function scope');

  const parentFunc = scopeManager.findParentScope('function');
  assert.strictEqual(parentFunc, localScope, 'Should locate nearest parent function scope');

  const childScopes = scopeManager.findChildScopes(global, true);
  assert.strictEqual(childScopes.length, 2, 'Global scope should trace 2 child scopes recursively');
  console.log('  ✔ Nearest declarations, parent scopes, and recursive child lookups verified.');

  // Test 4: AST Traversal Integration with ScopeVisitor
  console.log('\nTest 4: AST Traversal & ScopeVisitor integration');
  const sourceCode = `
    import { decrypt } from 'crypto-lib';
    const globalKey = "SECRET";
    
    class Cipher {
      constructor(public alg: string) {}
      
      encrypt(plainText: string) {
        const encrypted = plainText + "-cipher";
        if (true) {
          const blockVal = 100;
        }
        return encrypted;
      }
    }
  `;

  const scanContext = new ScanContext({
    targetType: 'code',
    target: sourceCode,
    fileName: 'src/cipher.ts',
    language: 'typescript'
  });

  const ast = provider.getAST(scanContext)!;
  const traversalManager = new ScopeManager();
  const scopeVisitor = new ScopeVisitor(traversalManager);

  const engine = new TraversalEngine();
  engine.registerVisitor(scopeVisitor);
  engine.traverse(ast);

  const allScopes = traversalManager.getScopes();
  assert(allScopes.length >= 6, 'Should resolve multiple scopes: global, module, class, constructor, encrypt, and nested block');

  const globalScope = allScopes.find(s => s.type === 'global')!;
  const moduleScope = allScopes.find(s => s.type === 'module')!;
  const classScope = allScopes.find(s => s.type === 'class')!;
  const blockScope = allScopes.find(s => s.type === 'block' && s.declarations.has('blockVal'))!;
  const methodBlockScope = allScopes.find(s => s.type === 'block' && s.declarations.has('encrypted'))!;

  // Check imports in module scope
  const decryptImport = moduleScope.declarations.get('decrypt');
  assert(decryptImport !== undefined, 'Should locate imported decrypt in module scope');
  assert.strictEqual(decryptImport.type, 'import', 'decrypt identifier type should be import');

  // Check variables in module scope
  const globalKeyDecl = moduleScope.declarations.get('globalKey');
  assert(globalKeyDecl !== undefined, 'Should locate globalKey variable');

  // Check method block scope variable
  assert(methodBlockScope !== undefined, 'Should locate method block scope');
  const encryptedDecl = methodBlockScope.declarations.get('encrypted');
  assert(encryptedDecl !== undefined, 'Should locate encrypted variable in method block');

  // Check block variable in block scope
  assert(blockScope !== undefined, 'Should locate inner block scope');
  const blockValDecl = blockScope.declarations.get('blockVal');
  assert(blockValDecl !== undefined, 'Should locate blockVal variable inside block scope');
  console.log(`  ✔ Integrated traversal parsed ${allScopes.length} lexical scopes successfully.`);

  console.log('\n====================================================');
  console.log(' ALL PHASE 8.3 SCOPE MANAGER TESTS PASSED! 🎉       ');
  console.log('====================================================');
}

runScopeTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
