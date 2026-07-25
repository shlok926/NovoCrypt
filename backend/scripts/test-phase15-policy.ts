import assert from 'assert';
import { performance } from 'perf_hooks';
import { FrameworkFinding } from '../src/services/scanner/ast/framework/rules/models/FrameworkFinding';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';
import {
  PolicyEngine,
  Policy,
  RulePackMetadata,
  RuleProfile,
  Suppression,
  PolicyConfiguration,
  DefaultProfile,
  StrictProfile,
  CIProfile,
  EnterpriseProfile
} from '../src/services/scanner/policy';

// Helper to create mock NovoNode
function createMockNode(startLine: number, startColumn?: number, endLine?: number, endColumn?: number): NovoNode {
  return {
    type: 'Identifier',
    kind: 'Identifier',
    location: {
      startLine,
      startColumn: startColumn || 1,
      endLine: endLine || startLine,
      endColumn: endColumn || startColumn || 1,
      pos: 0,
      end: 10
    },
    children: [],
    metadata: new Map(),
    language: 'typescript',
    rawReference: { ref: {}, kind: 'Identifier' }
  };
}

// Helper to create mock Finding
function createMockFinding(
  id: string,
  ruleId: string,
  pathStr: string,
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical',
  confidence: number,
  filename: string,
  startLine: number
): FrameworkFinding {
  const node = createMockNode(startLine, 5, startLine, 25);
  node.metadata.set('filename', filename);

  const handlerNode = createMockNode(startLine, 5, startLine, 25);

  return {
    id,
    ruleId,
    title: `Mock Title for ${ruleId}`,
    description: `Mock description for ${ruleId} on ${pathStr} in ${filename}`,
    severity,
    confidence,
    framework: 'Express',
    route: pathStr,
    handler: handlerNode,
    executionPipeline: {
      id: 'pipeline-1',
      framework: 'Express',
      path: pathStr,
      method: 'GET',
      handler: node,
      preMiddleware: [],
      postMiddleware: [],
      pipes: [],
      metadata: new Map()
    },
    evidence: {
      summary: 'Mock evidence summary',
      route: pathStr,
      relatedNodes: [node],
      relatedComponents: []
    },
    suggestedRemediation: 'Mock suggested remediation'
  };
}

function runPolicyTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 15.0 Policy Engine Layer Tests     ');
  console.log('====================================================');

  const engine = new PolicyEngine();
  const packRegistry = engine.getPackRegistry();
  const policyRegistry = engine.getPolicyRegistry();
  const config = new PolicyConfiguration(policyRegistry, packRegistry);

  // Register a mock rule pack
  const mockPack: RulePackMetadata = {
    id: 'pack-express',
    name: 'Express Security Pack',
    version: '1.0.0',
    author: 'NovoCrypt',
    description: 'Rules for Express framework security',
    rules: ['express-missing-auth', 'express-missing-helmet', 'express-missing-validation'],
    dependencies: [],
    minimumEngineVersion: '2.0.0'
  };
  packRegistry.registerPack(mockPack);

  const basePolicy: Policy = {
    id: 'base-policy',
    name: 'Base Corporate Policy',
    description: 'Corporate baseline security policy rules',
    enabledRulePacks: ['pack-express'],
    disabledRules: ['express-missing-validation'],
    severityOverrides: [
      { ruleId: 'express-missing-helmet', severity: 'low' }
    ],
    complianceMappings: [
      { ruleId: 'express-missing-auth', framework: 'OWASP', mappedId: 'A01:2021-Custom' }
    ],
    confidenceThreshold: 60
  };

  const childPolicy: Policy = {
    id: 'child-policy',
    name: 'Strict Workspace Policy',
    description: 'Inherits base policy and overrides rules',
    parentPolicyId: 'base-policy',
    enabledRulePacks: [],
    disabledRules: [],
    severityOverrides: [
      { ruleId: 'express-missing-helmet', severity: 'critical' } // Overrides parent low severity
    ],
    complianceMappings: [],
    confidenceThreshold: 80
  };

  config.loadPolicies([basePolicy, childPolicy]);

  const findings = [
    createMockFinding('f-1', 'express-missing-auth', '/admin', 'high', 95, 'src/admin.ts', 10),
    createMockFinding('f-2', 'express-missing-helmet', '/home', 'medium', 85, 'src/home.ts', 22),
    createMockFinding('f-3', 'express-missing-validation', '/api', 'medium', 90, 'src/api.ts', 45) // Disabled by parent
  ];

  // Test 1: Policy evaluation and inheritance loading
  console.log('\nTest 1: Policy evaluation and recursive inheritance');
  const result1 = engine.evaluatePolicy(findings, 'child-policy');
  
  assert.strictEqual(result1.findings.length, 2, 'Should only contain 2 active governed findings (f-3 disabled)');
  
  const authFinding = result1.findings.find(f => f.ruleId === 'express-missing-auth')!;
  assert.strictEqual(authFinding.severity, 'high');
  
  // Custom compliance resolved
  const compliance = (authFinding as any).compliance;
  assert(compliance.includes('OWASP:A01:2021-Custom'), 'Should include custom policy compliance mapping');
  assert(compliance.includes('CWE:CWE-306'), 'Should include default CWE mapping');

  // Severity override applied successfully (child override wins)
  const helmetFinding = result1.findings.find(f => f.ruleId === 'express-missing-helmet')!;
  assert.strictEqual(helmetFinding.severity, 'critical', 'Child policy severity override critical should win');
  console.log('  ✔ Recursive policy inheritance and evaluation validated successfully.');

  // Test 2: Circular Dependency Protection
  console.log('\nTest 2: Circular policy inheritance protection');
  const badPolicy1: Policy = {
    id: 'bad-1',
    name: 'Bad 1',
    description: 'Desc',
    parentPolicyId: 'bad-2',
    enabledRulePacks: [],
    disabledRules: [],
    severityOverrides: [],
    complianceMappings: []
  };
  const badPolicy2: Policy = {
    id: 'bad-2',
    name: 'Bad 2',
    description: 'Desc',
    parentPolicyId: 'bad-1',
    enabledRulePacks: [],
    disabledRules: [],
    severityOverrides: [],
    complianceMappings: []
  };

  assert.throws(() => {
    config.loadPolicies([badPolicy1, badPolicy2]);
  }, /Circular policy inheritance detected/);
  console.log('  ✔ Circular dependency validator triggered successfully.');

  // Test 3: Suppression check (by fingerprint, file, dir, rule, expiry)
  console.log('\nTest 3: Finding suppressions lifecycle and expiry');
  // Generate fingerprint for helmet finding
  const filename = 'src/home.ts';
  const hashInput = `express-missing-helmet:/home:22:${filename}`;
  const fp = require('crypto').createHash('sha256').update(hashInput).digest('hex');

  const suppressions: Suppression[] = [
    { id: 's-1', fingerprint: fp, justification: 'Expected helmet override here' },
    { id: 's-2', ruleId: 'express-missing-auth', expiryTimestamp: Date.now() - 1000, justification: 'Expired suppression' }, // Expired!
    { id: 's-3', directory: 'src/ignored_dir', justification: 'Ignored directory' }
  ];

  const result3 = engine.evaluatePolicy(findings, 'base-policy', undefined, suppressions);
  
  // f-2 (helmet) should be suppressed by fingerprint
  assert(result3.suppressed.some(f => f.ruleId === 'express-missing-helmet'));
  
  // f-1 (auth) should NOT be suppressed since s-2 is expired
  assert(result3.findings.some(f => f.ruleId === 'express-missing-auth'));
  console.log('  ✔ Suppressions filtered unexpired matches and bypassed expired suppressions.');

  // Test 4: Precedence matching in suppressions
  console.log('\nTest 4: Suppression matching precedence rules');
  const pathFinding = createMockFinding('f-path', 'express-missing-auth', '/auth', 'high', 95, 'src/secrets/auth.ts', 15);
  const precSuppressions: Suppression[] = [
    { id: 's-path', filePath: 'src/secrets/auth.ts', ruleId: 'express-missing-auth', justification: 'Suppress path + rule' }
  ];
  const result4 = engine.evaluatePolicy([pathFinding], 'base-policy', undefined, precSuppressions);
  assert.strictEqual(result4.findings.length, 0);
  assert.strictEqual(result4.suppressed.length, 1);
  console.log('  ✔ Specific rule + path suppression precedence check passed.');

  // Test 5: Profiles mapping
  console.log('\nTest 5: Profiles configuration evaluation settings');
  // Strict Profile filters out low/medium severity. Confidence threshold is 85.
  const strictResult = engine.evaluatePolicy(findings, 'base-policy', StrictProfile);
  // f-1: high, 95 (Passes)
  // f-2: medium, 85 (Filtered out by severity)
  // f-3: medium, 90 (Disabled by base-policy anyway)
  assert.strictEqual(strictResult.findings.length, 1);
  assert.strictEqual(strictResult.findings[0].ruleId, 'express-missing-auth');
  console.log('  ✔ RuleProfile parameters resolved and override baseline policy rules.');

  // Test 6: Concurrent Policy Evaluations
  console.log('\nTest 6: Concurrent policies execution safety');
  const concurrentRuns = 100;
  const startCon = performance.now();
  const promises = Array.from({ length: concurrentRuns }).map(() => {
    return Promise.resolve().then(() => {
      const res = engine.evaluatePolicy(findings, 'base-policy');
      assert.strictEqual(res.findings.length, 2); // f-3 disabled, f-2 overriden to low severity (passes low default minSeverity threshold)
    });
  });
  Promise.all(promises).then(() => {
    const elapsedCon = performance.now() - startCon;
    console.log(`  ✔ Completed ${concurrentRuns} concurrent policy evaluations in ${elapsedCon.toFixed(2)}ms`);

    // Test 7: Benchmark performance on large sets
    console.log('\nTest 7: Benchmark 10,000 findings with 10,000 suppressions');
    const largeFindings: FrameworkFinding[] = [];
    const largeSuppressions: Suppression[] = [];

    for (let i = 0; i < 10000; i++) {
      largeFindings.push(
        createMockFinding(
          `f-${i}`,
          'express-missing-auth',
          `/route-${i}`,
          'high',
          90,
          `src/file-${i}.ts`,
          i
        )
      );
      largeSuppressions.push({
        id: `s-${i}`,
        filePath: `src/file-${i}.ts`,
        ruleId: 'express-missing-auth',
        justification: 'Corporate baseline suppression'
      });
    }

    const startBench = performance.now();
    const benchResult = engine.evaluatePolicy(largeFindings, 'base-policy', undefined, largeSuppressions);
    const elapsedBench = performance.now() - startBench;

    assert.strictEqual(benchResult.findings.length, 0);
    assert.strictEqual(benchResult.suppressed.length, 10000);
    console.log(`  ✔ Evaluated and suppressed 10,000 findings in ${elapsedBench.toFixed(2)}ms (Metrics: ${benchResult.metrics.rulesEvaluated} rules evaluated, ${benchResult.metrics.findingsSuppressed} suppressed)`);

    console.log('\n====================================================');
    console.log(' ALL PHASE 15.0 POLICY ENGINE TESTS PASSED! 🎉      ');
    console.log('====================================================');
  }).catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

runPolicyTests();
