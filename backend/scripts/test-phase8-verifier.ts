import assert from 'assert';
import { ParserManager } from '../src/services/scanner/ast/ParserManager';
import { ASTProvider } from '../src/services/scanner/ast/ASTProvider';
import { TraversalEngine } from '../src/services/scanner/ast/TraversalEngine';
import { ScopeManager } from '../src/services/scanner/ast/ScopeManager';
import { ScopeVisitor } from '../src/services/scanner/ast/ScopeVisitor';
import { SymbolTable } from '../src/services/scanner/ast/SymbolTable';
import { SymbolVisitor } from '../src/services/scanner/ast/SymbolVisitor';
import { TypeResolver } from '../src/services/scanner/ast/TypeResolver';
import { SemanticVerifier } from '../src/services/scanner/ast/SemanticVerifier';
import { ScanContext, ScanFinding } from '../src/services/scanner/types';

async function runVerifierTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 8.6 SemanticVerifier Tests         ');
  console.log('====================================================\n');

  const parserManager = new ParserManager();
  const provider = new ASTProvider(parserManager);

  const source = `
    import { createDecipheriv } from 'crypto';
    const algorithm = "AES-128-CBC";
    let keyMaterial: Buffer = Buffer.alloc(16);
    
    function decryptData(cipherText: string) {
      const algorithm = "AES-256-GCM"; // shadowed
      return algorithm;
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
  const typeResolver = new TypeResolver(symbolTable);

  const scopeVisitor = new ScopeVisitor(scopeManager);
  const symbolVisitor = new SymbolVisitor(scopeManager, symbolTable);

  const engine = new TraversalEngine();
  engine.registerVisitor(scopeVisitor);
  engine.registerVisitor(symbolVisitor);
  engine.traverse(ast);

  ast.parserMetadata.set('scopeManager', scopeManager);
  ast.parserMetadata.set('symbolTable', symbolTable);
  ast.parserMetadata.set('typeResolver', typeResolver);

  // Test 1: Regex-only finding (no AST match)
  console.log('Test 1: Unverified candidate fallback (no AST match)');
  const regexOnlyFinding: ScanFinding = {
    ruleId: 'AES001',
    confidence: 60,
    confidenceExplanation: { level: 'Medium', reason: 'Regex matched' },
    evidence: {
      line: 99, // Line doesn't exist in file
      snippet: 'not_found',
      matchedPattern: 'not_found',
      qualityScore: 60
    }
  };

  const results1 = SemanticVerifier.verifyAll([regexOnlyFinding], ast);
  assert.strictEqual(results1.length, 1, 'Should preserve finding');
  assert.strictEqual(results1[0].confidence, 60, 'Should retain original confidence score');
  console.log('  ✔ Correctly fallback-passed unverified regex candidates.');

  // Test 2: Symbol Match confidence upgrade (Confidence 75)
  console.log('\nTest 2: Semantic symbol confirmation & confidence upgrade');
  const candidateFinding: ScanFinding = {
    ruleId: 'AES001',
    confidence: 60,
    confidenceExplanation: { level: 'Medium', reason: 'Regex matched' },
    evidence: {
      line: 3,
      snippet: 'algorithm',
      matchedPattern: 'AES',
      qualityScore: 60
    }
  };

  const results2 = SemanticVerifier.verifyAll([candidateFinding], ast);
  assert.strictEqual(results2.length, 1, 'Should return verified finding');
  assert(results2[0].confidence >= 75, 'Confidence should be upgraded to 75 or higher');
  
  const semanticMeta = results2[0].metadata?.semanticEvidence;
  assert(semanticMeta !== undefined, 'Should attach semanticEvidence metadata');
  assert.strictEqual(semanticMeta.resolvedSymbol, 'algorithm', 'Should map correct resolved symbol name');
  assert.strictEqual(semanticMeta.verificationResult, 'Confirmed', 'Verification result should be Confirmed');
  console.log(`  ✔ Successfully resolved Symbol "algorithm", confidence upgraded to ${results2[0].confidence}.`);

  // Test 3: Type confirmation checks (Buffer types verification ➔ 98%)
  console.log('\nTest 3: Static Type confirmation (Buffer check)');
  const keyFinding: ScanFinding = {
    ruleId: 'AES002',
    confidence: 60,
    confidenceExplanation: { level: 'Medium', reason: 'Regex matched' },
    evidence: {
      line: 4,
      snippet: 'keyMaterial',
      matchedPattern: 'keyMaterial',
      qualityScore: 60
    }
  };

  const results3 = SemanticVerifier.verifyAll([keyFinding], ast);
  assert.strictEqual(results3[0].confidence, 98, 'Key material matching Buffer type should upgrade to 98%');
  assert.strictEqual(results3[0].metadata?.semanticEvidence.resolvedType, 'Buffer', 'Should resolve Type as Buffer');
  console.log('  ✔ Type checked successfully as Buffer, confidence upgraded to 98% (AST Confirmation).');

  // Test 4: Shadowed Scope verification
  console.log('\nTest 4: Shadowed variable scope resolution');
  const shadowedFinding: ScanFinding = {
    ruleId: 'AES001',
    confidence: 60,
    evidence: {
      line: 7,
      snippet: 'algorithm',
      matchedPattern: 'AES',
      qualityScore: 60
    }
  };

  const results4 = SemanticVerifier.verifyAll([shadowedFinding], ast);
  const shadowedMeta = results4[0].metadata?.semanticEvidence;
  assert(shadowedMeta !== undefined, 'Should resolve shadowed variable');
  assert(shadowedMeta.resolvedScope.includes('block') || shadowedMeta.resolvedScope.includes('function'), 'Should resolve to local block or function scope, not module scope');
  assert.strictEqual(shadowedMeta.declarationLocation.startLine, 7, 'Declaration location should point to line 7 shadowed definition');
  console.log('  ✔ Correctly resolved shadowed identifier scope boundaries.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 8.6 SEMANTICVERIFIER TESTS PASSED! 🎉    ');
  console.log('====================================================');
}

runVerifierTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
