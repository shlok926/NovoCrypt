import assert from 'assert';
import { performance } from 'perf_hooks';
import {
  AdvisorOrchestrator,
  SecurityReasoner,
  RootCauseAnalyzer,
  EvidenceLinker,
  RecommendationGenerator,
  RecommendationConflictAnalyzer,
  FixComparator,
  PrioritisationEngine,
  KnowledgeResolver,
  BestPracticeAdvisor,
  DeveloperGuidanceGenerator,
  ExplanationFormatter,
  AdvisorEngine
} from '../src/services/scanner';

function runAdvisorTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 22.0 AI Advisor Layer Tests        ');
  console.log('====================================================');

  const orchestrator = new AdvisorOrchestrator();

  const mockWorkspace = {
    root: 'd:/Desktop/PQC',
    discoveredFiles: ['src/db.ts'],
    languageStatistics: { typescript: 100 },
    detectedFrameworks: ['express'],
    metadata: new Map<string, any>([
      ['vulnerabilityId', 'sql_injection'],
      ['filePath', 'src/db.ts'],
      ['steps', ['input read', 'concatenation', 'sink execution']],
      ['strategies', ['parameterize', 'orm']]
    ])
  };

  // Test 1: Security Explanations with Workspace
  console.log('\nTest 1: Vulnerability explanation templates reasoning with Workspace');
  const sqliExplanation = orchestrator.generateSecurityExplanations(mockWorkspace);
  sqliExplanation.then(({ summary, metrics }) => {
    assert.strictEqual(summary.explanations.length, 1);
    assert(summary.explanations[0].issueSummary.includes('SQL Injection'));
    assert(metrics.averageExplanationSize > 0);
    console.log('  ✔ SQL Injection explanation narrative compiled via Workspace.');

    // Test 1b: Security Explanations with legacy string arguments
    console.log('Test 1b: Explanation compilation via legacy string parameters (backward compatibility)');
    return orchestrator.generateSecurityExplanations('sql_injection', 'src/db.ts', ['input read']);
  }).then(({ summary }) => {
    assert.strictEqual(summary.explanations.length, 1);
    console.log('  ✔ Legacy backward compatibility checks passed.');

    // Test 2: Root Cause Analysis with Workspace
    console.log('\nTest 2: Root cause analysis pattern detection');
    const rootCause = orchestrator.analyseRootCauses(mockWorkspace);
    assert.strictEqual(rootCause[0].vulnerabilityId, 'sql_injection');
    assert(rootCause[0].pattern.includes('concatenation'));
    console.log('  ✔ Root cause parameters detected.');

    // Test 3: Recommendations Generation with Workspace
    console.log('\nTest 3: Structured developer remediation recommendations');
    const recs = orchestrator.generateRecommendations(mockWorkspace);
    assert.strictEqual(recs.length, 1);
    assert(recs[0].title.includes('parameterized queries'));
    console.log('  ✔ Recommended actions compiled.');

    // Test 4: Recommendation Conflicts Resolution
    console.log('\nTest 4: Recommendation duplicate conflicts detector');
    const conflicts = RecommendationConflictAnalyzer.analyzeConflicts([...recs, ...recs]);
    assert.strictEqual(conflicts.length, 1);
    assert(conflicts[0].isConflicting);
    console.log('  ✔ Duplicate recommendation paths flagged.');

    // Test 5: Fix Comparison with Workspace
    console.log('\nTest 5: Remediate strategy comparative analysis');
    const comparisons = orchestrator.compareRemediationStrategies(mockWorkspace);
    assert.strictEqual(comparisons.length, 2);
    assert.strictEqual(comparisons[0].strategy, 'parameterize');
    assert.strictEqual(comparisons[0].complexity, 'Low');
    assert.strictEqual(comparisons[1].strategy, 'orm');
    assert.strictEqual(comparisons[1].complexity, 'High');
    console.log('  ✔ Parameterization vs ORM complexity compared.');

    // Test 6: Prioritisation Engine
    console.log('\nTest 6: Priority scoring sort orders');
    const sorted = PrioritisationEngine.sort([
      { recommendationId: 'r1', title: 'Step 1', steps: [], priority: 'Medium' },
      { recommendationId: 'r2', title: 'Step 2', steps: [], priority: 'High' }
    ]);
    assert.strictEqual(sorted[0].recommendationId, 'r2');
    console.log('  ✔ Priorities sorted correctly.');

    // Test 7: Knowledge Resolver
    console.log('\nTest 7: Security standards mappings');
    const resolver = new KnowledgeResolver();
    const ref = resolver.resolve('sql_injection');
    assert.strictEqual(ref?.id, 'CWE-89');
    console.log('  ✔ CWE standards mapped successfully.');

    // Test 8: Best Practice Advisor
    console.log('\nTest 8: Framework-specific best practices advice');
    const bpAdvisor = new BestPracticeAdvisor();
    const advice = bpAdvisor.getAdvice('express_security');
    assert(advice?.advice.includes('helmet'));
    console.log('  ✔ Framework security advice compiled.');

    // Test 9: Developer Guidance with Workspace
    console.log('\nTest 9: Level-specific guidance details');
    const insights = orchestrator.generateDeveloperGuidance(mockWorkspace);
    assert.strictEqual(insights.length, 3);
    assert.strictEqual(insights[0].level, 'beginner');
    assert.strictEqual(insights[2].level, 'advanced');
    console.log('  ✔ Beginner, Intermediate, and Advanced guidance resolved.');

    // Test 10: Formatting
    console.log('\nTest 10: Renders formatted explanations output');
    const formatted = ExplanationFormatter.format(summary.explanations[0]);
    assert(formatted.startsWith('###'));
    console.log('  ✔ Markdown text formatting completed.');

    // Test 11: Benchmark simulation
    console.log('\nTest 11: Benchmark generating 10,000 explanations');
    const startBench = performance.now();
    for (let i = 0; i < 10000; i++) {
      orchestrator.generateRecommendations(mockWorkspace);
    }
    const elapsedBench = performance.now() - startBench;
    console.log(`  ✔ Generated 10,000 explanations in ${elapsedBench.toFixed(2)}ms`);

    console.log('\n====================================================');
    console.log(' ALL PHASE 22.0 AI ADVISOR TESTS PASSED! 🎉        ');
    console.log('====================================================');
  }).catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

runAdvisorTests();
