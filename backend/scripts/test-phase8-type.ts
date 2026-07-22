import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { SymbolTable } from '../src/services/scanner/ast/SymbolTable';
import { SymbolVisitor } from '../src/services/scanner/ast/SymbolVisitor';
import { TypeResolver } from '../src/services/scanner/ast/TypeResolver';
import { isPrimitive, isBufferLike, isAssignable, Types } from '../src/services/scanner/ast/Type';
import { ScanContext } from '../src/services/scanner/types';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';

async function runTypeTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 8.5 TypeResolver & Semantic Tests  ');
  console.log('====================================================\n');

  const parserManager = new ParserManager();
  const provider = new ASTProvider(parserManager);

  const source = `
    const simpleString = "hello";
    const simpleNumber = 42;
    const isReady = true;
    
    let explicitBuffer: Buffer;
    let explicitUint8: Uint8Array;
    let unionVal: string | number;
    let tupleVal: [string, number];
    let arrayVal: number[];

    function getPromise(): Promise<Buffer> {
      return Promise.resolve(Buffer.alloc(10));
    }

    async function process() {
      const awaited = await getPromise();
      return awaited;
    }
  `;

  const context = new ScanContext({
    targetType: 'code',
    target: source,
    fileName: 'src/type-targets.ts',
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

  const resolver = new TypeResolver(symbolTable);

  // Test 1: Literal and Primitive Type checks
  console.log('Test 1: Literal and Primitive Inference');
  let stringNode: any, numberNode: any, boolNode: any;
  const findLiterals = (n: NovoNode) => {
    if (n.type === 'VariableDeclaration') {
      const name = n.metadata.get('name');
      if (name === 'simpleString') stringNode = n;
      if (name === 'simpleNumber') numberNode = n;
      if (name === 'isReady') boolNode = n;
    }
    n.children.forEach(findLiterals);
  };
  findLiterals(ast.root);

  const strType = resolver.resolveType(stringNode);
  const numType = resolver.resolveType(numberNode);
  const boolType = resolver.resolveType(boolNode);

  assert.strictEqual(strType.kind, 'Literal', 'simpleString should infer Literal');
  assert.strictEqual(strType.value, 'hello', 'simpleString literal value should be "hello"');
  assert(isPrimitive(strType), 'String literal should be a primitive');

  assert.strictEqual(numType.kind, 'Literal', 'simpleNumber should infer Literal');
  assert.strictEqual(numType.value, 42, 'simpleNumber literal value should be 42');
  assert(isPrimitive(numType), 'Numeric literal should be a primitive');

  assert.strictEqual(boolType.kind, 'Literal', 'isReady should infer Literal');
  assert.strictEqual(boolType.value, true, 'isReady literal value should be true');
  assert(isPrimitive(boolType), 'Boolean literal should be a primitive');
  console.log('  ✔ Literals inferred correctly, primitives recognized.');

  // Test 2: Buffer and Uint8Array types check (isBufferLike)
  console.log('\nTest 2: Buffer and Uint8Array checks');
  let bufferNode: any, uint8Node: any;
  const findBuffers = (n: NovoNode) => {
    if (n.type === 'VariableDeclaration') {
      const name = n.metadata.get('name');
      if (name === 'explicitBuffer') bufferNode = n;
      if (name === 'explicitUint8') uint8Node = n;
    }
    n.children.forEach(findBuffers);
  };
  findBuffers(ast.root);

  const bufType = resolver.resolveType(bufferNode);
  const u8Type = resolver.resolveType(uint8Node);

  assert.strictEqual(bufType.kind, 'Buffer', 'explicitBuffer should resolve to Buffer');
  assert(isBufferLike(bufType), 'Buffer is buffer-like');

  assert.strictEqual(u8Type.kind, 'Uint8Array', 'explicitUint8 should resolve to Uint8Array');
  assert(isBufferLike(u8Type), 'Uint8Array is buffer-like');
  console.log('  ✔ Buffer and Uint8Array types mapped correctly and verified.');

  // Test 3: Arrays, Tuples, and Unions
  console.log('\nTest 3: Arrays, Tuples, and Unions checks');
  let arrayNode: any, tupleNode: any, unionNode: any;
  const findCollections = (n: NovoNode) => {
    if (n.type === 'VariableDeclaration') {
      const name = n.metadata.get('name');
      if (name === 'arrayVal') arrayNode = n;
      if (name === 'tupleVal') tupleNode = n;
      if (name === 'unionVal') unionNode = n;
    }
    n.children.forEach(findCollections);
  };
  findCollections(ast.root);

  const arrType = resolver.resolveType(arrayNode);
  const tupType = resolver.resolveType(tupleNode);
  const uniType = resolver.resolveType(unionNode);

  assert.strictEqual(arrType.kind, 'Array', 'arrayVal should resolve to Array');
  assert.strictEqual(arrType.elementTypes?.[0].kind, 'Number', 'Array element type should be Number');

  assert.strictEqual(tupType.kind, 'Tuple', 'tupleVal should resolve to Tuple');
  assert.strictEqual(tupType.elementTypes?.length, 2, 'Tuple should have 2 elements');

  assert.strictEqual(uniType.kind, 'Union', 'unionVal should resolve to Union');
  assert.strictEqual(uniType.elementTypes?.length, 2, 'Union should contain 2 types');
  console.log('  ✔ Union, Tuple, and Array structural models verified.');

  // Test 4: Promise and Await resolution
  console.log('\nTest 4: Promise returns & Await resolution checks');
  let promiseFuncNode: any, awaitedNode: any;
  const findPromises = (n: NovoNode) => {
    if (n.type === 'FunctionDeclaration') {
      const name = n.metadata.get('name');
      if (name === 'getPromise') promiseFuncNode = n;
    }
    if (n.type === 'VariableDeclaration') {
      const name = n.metadata.get('name');
      if (name === 'awaited') awaitedNode = n;
    }
    n.children.forEach(findPromises);
  };
  findPromises(ast.root);

  const returnType = resolver.resolveReturnType(promiseFuncNode);
  assert.strictEqual(returnType.kind, 'Promise', 'getPromise should return Promise type');
  assert.strictEqual(returnType.returnType?.kind, 'Buffer', 'Promise inner type should be Buffer');

  const awaitedType = resolver.resolveType(awaitedNode);
  assert.strictEqual(awaitedType.kind, 'Buffer', 'Awaited variable type should resolve to Buffer');
  console.log('  ✔ Promise return types and async Await type extraction verified.');

  // Test 5: Assignability validation (isAssignable)
  console.log('\nTest 5: Assignability check constraints');
  assert(isAssignable(Types.String, Types.String), 'string should assign to string');
  assert(isAssignable(Types.Never, Types.String), 'never should assign to string');
  assert(isAssignable(Types.String, Types.Any), 'string should assign to any');
  assert(isAssignable(Types.String, Types.Unknown), 'string should assign to unknown');
  assert(isAssignable(Types.createLiteral("hello", 'String'), Types.String), 'string literal "hello" should assign to string');
  assert(!isAssignable(Types.Number, Types.String), 'number should NOT assign to string');
  console.log('  ✔ Assignability contracts validation rules function correctly.');

  // Test 6: Cache Reuse
  console.log('\nTest 6: Type Cache check');
  resolver.clear();
  const initMetrics = (resolver as any).cache.size;
  assert.strictEqual(initMetrics, 0, 'Cache should be empty');
  
  resolver.resolveType(stringNode);
  const size1 = (resolver as any).cache.size;
  assert(size1 > 0, 'Cache should save resolved types');
  
  resolver.resolveType(stringNode);
  const size2 = (resolver as any).cache.size;
  assert.strictEqual(size1, size2, 'Subsequent checks should query cache, not rebuild types');
  console.log('  ✔ Caching strategy avoids duplicate resolutions successfully.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 8.5 TYPERESOLVER TESTS PASSED! 🎉        ');
  console.log('====================================================');
}

runTypeTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
