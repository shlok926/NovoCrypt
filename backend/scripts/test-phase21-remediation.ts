import assert from 'assert';
import { performance } from 'perf_hooks';
import {
  RemediationOrchestrator,
  CodeTransformer,
  SecurePatch,
  BehaviourAnalyzer,
  RegressionAnalyzer,
  PatchValidator,
  FixDependencyAnalyzer,
  PatchRanker,
  PatchExplainer
} from '../src/services/scanner';

function runRemediationTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 21.0 Automated Remediation Tests   ');
  console.log('====================================================');

  const orchestrator = new RemediationOrchestrator();

  // Test 1: SQL Injection parameterized query patch generation
  console.log('\nTest 1: SQL Injection parameterized query patch generation');
  const sqliOriginal = 'db.query("SELECT * FROM users WHERE id=" + id)';
  const sqlPatches = orchestrator.generateSecurePatches('sqli_query', sqliOriginal);
  assert.strictEqual(sqlPatches.length, 1);
  assert.strictEqual(sqlPatches[0].patchId, 'sqli_query');
  assert.strictEqual(sqlPatches[0].replacementCode, 'db.query("SELECT * FROM users WHERE id=?", [id])');
  console.log('  ✔ SQL parameterized query replacement patch successfully generated.');

  // Test 2: Framework Fixes (Express Helmet + React DOMPurify)
  console.log('\nTest 2: Framework-specific patch generation (Express & React)');
  const expressOriginal = 'app.use(cors())';
  const expressPatches = orchestrator.generateSecurePatches('express_helmet', expressOriginal);
  assert(expressPatches.some(p => p.replacementCode.includes('helmet()')));

  const reactOriginal = 'dangerouslySetInnerHTML={{ __html: input }}';
  const reactPatches = orchestrator.generateSecurePatches('react_inner_html', reactOriginal);
  assert(reactPatches.some(p => p.replacementCode.includes('DOMPurify.sanitize')));
  console.log('  ✔ Express Helmet integration and React DOMPurify sanitization patches generated.');

  // Test 3: Behaviour Preservation Analysis
  console.log('\nTest 3: Behaviour preservation logic audits');
  const origCall = 'db.query("SELECT * FROM users")';
  const replCall = 'db.query("SELECT * FROM users WHERE id=?", [1])';
  const behavior = BehaviourAnalyzer.analyze(origCall, replCall);
  assert.strictEqual(behavior.apiPreserved, true, 'Calling the same db.query function name should preserve API compatibility');
  console.log('  ✔ Function calling API signature preservation verified.');

  // Test 4: Regression Risk Analysis
  console.log('\nTest 4: Regression risk estimation');
  const risk1 = RegressionAnalyzer.estimateRisk('app.use(cors())', 'app.use(helmet());\napp.use(cors())');
  assert.strictEqual(risk1.label, 'Medium', 'Adding global framework middleware raises risk to Medium');

  const risk2 = RegressionAnalyzer.estimateRisk('db.query(sql)', 'db.query(sql, [])');
  assert.strictEqual(risk2.label, 'Low', 'Adding local call parameters retains Low regression risk');
  console.log('  ✔ Pipeline middleware and local call risks estimated correctly.');

  // Test 5: Secure API Recommendations
  console.log('\nTest 5: Secure API alternatives recommendations');
  const alts = orchestrator.recommendSecureApis('eval');
  assert.strictEqual(alts.length, 1);
  assert.strictEqual(alts[0].secureApi, 'JSON.parse()');
  console.log('  ✔ JSON.parse recommended as a secure replacement for eval.');

  // Test 6: Patch Validation
  console.log('\nTest 6: Patch syntax validation checks');
  const validPatch: SecurePatch = {
    patchId: 'p1',
    originalCode: 'eval(x)',
    replacementCode: 'JSON.parse(x)',
    explanation: 'use JSON.parse',
    frameworkCompatibility: []
  };
  const invalidPatch: SecurePatch = {
    patchId: 'p2',
    originalCode: 'eval(x)',
    replacementCode: 'const x = {', // Syntax error: missing brace
    explanation: 'unbalanced braces',
    frameworkCompatibility: []
  };
  assert.strictEqual(PatchValidator.isPatchValid(validPatch), true);
  assert.strictEqual(PatchValidator.isPatchValid(invalidPatch), false);
  console.log('  ✔ Valid and invalid patch code segments correctly classified.');

  // Test 7: Fix Dependency Analyzer
  console.log('\nTest 7: Fix dependency analyzer package checks');
  const deps = FixDependencyAnalyzer.resolveDependencies(expressPatches[1] || expressPatches[0]);
  assert(deps.includes('helmet npm package'));
  console.log('  ✔ Pre-requisite helmet middleware dependency identified.');

  // Test 8: Patch Ranker
  console.log('\nTest 8: Ranking patch candidates');
  const ranked = PatchRanker.rank([
    { candidateId: 'c1', patch: validPatch, priority: 1 },
    { candidateId: 'c2', patch: validPatch, priority: 5 }
  ]);
  assert.strictEqual(ranked[0].candidateId, 'c2', 'Ranker should sort candidates by descending priority');
  console.log('  ✔ Patch priorities ranked successfully.');

  // Test 9: Patch Explainer
  console.log('\nTest 9: Patch explainer narrative logs');
  const explanation = PatchExplainer.explain(validPatch);
  assert(explanation.includes('Replaced:'));
  console.log('  ✔ Plain-text remediation logs compiled cleanly.');

  // Test 10: Benchmark simulation
  console.log('\nTest 10: Benchmark generating 10,000 secure patches');
  const startBench = performance.now();
  for (let i = 0; i < 10000; i++) {
    orchestrator.generateSecurePatches('sqli_query', sqliOriginal);
  }
  const elapsedBench = performance.now() - startBench;
  console.log(`  ✔ Generated 10,000 secure code patches in ${elapsedBench.toFixed(2)}ms`);

  console.log('\n====================================================');
  console.log(' ALL PHASE 21.0 Automated Remediation TESTS PASSED! 🎉 ');
  console.log('====================================================');
}

runRemediationTests();
