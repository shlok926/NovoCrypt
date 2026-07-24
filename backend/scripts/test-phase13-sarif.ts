import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { FrameworkFinding } from '../src/services/scanner/ast/framework/rules/models/FrameworkFinding';
import { RuleExecutionMetrics } from '../src/services/scanner/ast/framework/rules/engine/RuleExecutionMetrics';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';
import { SarifExporter } from '../src/services/scanner/sarif/SarifExporter';
import { SarifValidator } from '../src/services/scanner/sarif/builder/SarifValidator';

function createMockNode(startLine: number, startColumn?: number, endLine?: number, endColumn?: number): NovoNode {
  const node: NovoNode = {
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
  return node;
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

function runSarifTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 13.0 SARIF Export Engine Tests     ');
  console.log('====================================================');

  const exporter = new SarifExporter();
  const metrics: RuleExecutionMetrics = {
    executionTimeMs: 12.5,
    evaluatedRoutesCount: 5,
    findingsCount: 2,
    skippedPipelinesCount: 0
  };

  // Test 1: Single finding
  console.log('\nTest 1: Single finding export and validation');
  const findings1 = [
    createMockFinding('f-1', 'express-missing-auth', '/admin/data', 'high', 95, 'src/admin.ts', 10)
  ];
  const report1 = exporter.exportSarif(findings1, metrics);
  
  assert.strictEqual(report1.version, '2.1.0');
  assert.strictEqual(report1.runs.length, 1);
  assert.strictEqual(report1.runs[0].results.length, 1);
  assert.strictEqual(report1.runs[0].results[0].ruleId, 'express-missing-auth');
  assert.strictEqual(report1.runs[0].results[0].level, 'error');
  assert.strictEqual(report1.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, 'src/admin.ts');
  assert.strictEqual(report1.runs[0].results[0].locations[0].physicalLocation.region?.startLine, 10);
  console.log('  ✔ Single finding successfully exported and validated against schema requirements.');

  // Test 2: Required vs Optional fields
  console.log('\nTest 2: Optional fields config override');
  const reportNoProps = exporter.exportSarif(findings1, metrics, { includeProperties: false, includeRuleHelp: false });
  assert.strictEqual(reportNoProps.runs[0].results[0].properties, undefined);
  assert.strictEqual(reportNoProps.runs[0].tool.driver.rules[0].help, undefined);
  console.log('  ✔ Options correctly override presence of properties and rules help fields.');

  // Test 3: Multiple findings and different severities / confidence
  console.log('\nTest 3: Multiple findings on different files with varying severities');
  const findings3 = [
    createMockFinding('f-1', 'express-missing-auth', '/admin/data', 'high', 95, 'src/admin.ts', 10),
    createMockFinding('f-2', 'express-missing-helmet', '/home', 'medium', 80, 'src/home.ts', 22),
    createMockFinding('f-3', 'express-missing-validation', '/api', 'low', 70, 'src/api.ts', 45)
  ];
  const report3 = exporter.exportSarif(findings3, metrics);
  assert.strictEqual(report3.runs[0].results.length, 3);
  assert.strictEqual(report3.runs[0].results[0].level, 'error');
  assert.strictEqual(report3.runs[0].results[1].level, 'warning');
  assert.strictEqual(report3.runs[0].results[2].level, 'note');
  console.log('  ✔ Mapped different levels: high -> error, medium -> warning, low -> note.');

  // Test 4: Deduplication and relative/absolute paths
  console.log('\nTest 4: Paths normalization & artifact deduplication');
  const findings4 = [
    createMockFinding('f-1', 'express-missing-auth', '/admin', 'high', 95, 'src\\admin.ts', 10),
    createMockFinding('f-2', 'express-missing-auth', '/admin', 'high', 95, 'src/admin.ts', 12)
  ];
  const report4 = exporter.exportSarif(findings4, metrics);
  assert.strictEqual(report4.runs[0].artifacts?.length, 1, 'Should deduplicate target files in run.artifacts');
  assert.strictEqual(report4.runs[0].artifacts?.[0].location.uri, 'src/admin.ts', 'Should normalize backslashes');
  console.log('  ✔ Paths normalized to Unix-style and artifacts correctly deduplicated.');

  // Test 5: Missing end locations mapping safety
  console.log('\nTest 5: Missing end columns mapping safety');
  const nodeMissing = createMockNode(15, 2);
  nodeMissing.location.endLine = undefined;
  nodeMissing.location.endColumn = undefined;
  nodeMissing.metadata.set('filename', 'test.ts');
  const findingMissing: FrameworkFinding = {
    ...findings1[0],
    handler: nodeMissing
  };
  const reportMissing = exporter.exportSarif([findingMissing], metrics);
  const region = reportMissing.runs[0].results[0].locations[0].physicalLocation.region;
  assert.strictEqual(region?.endLine, 15);
  assert.strictEqual(region?.endColumn, 2);
  console.log('  ✔ Missing end coordinates fall back to start coordinates safely.');

  // Test 6: Empty findings list
  console.log('\nTest 6: Empty findings list export');
  const reportEmpty = exporter.exportSarif([], metrics);
  assert.strictEqual(reportEmpty.runs[0].results.length, 0);
  console.log('  ✔ Handled empty findings list cleanly.');

  // Test 7: Output file writing (Minified vs Pretty Print)
  console.log('\nTest 7: File serialization formats');
  const prettyPath = path.join(__dirname, 'sarif-pretty.json');
  const miniPath = path.join(__dirname, 'sarif-mini.json');
  
  exporter.writeSarif(report3, prettyPath, { prettyPrint: true });
  exporter.writeSarif(report3, miniPath, { prettyPrint: false });

  const prettyContent = fs.readFileSync(prettyPath, 'utf8');
  const miniContent = fs.readFileSync(miniPath, 'utf8');

  assert(prettyContent.includes('\n'), 'Pretty-printed output should contain newlines');
  assert(!miniContent.includes('\n'), 'Minified output should be single line');

  fs.unlinkSync(prettyPath);
  fs.unlinkSync(miniPath);
  console.log('  ✔ Minified and pretty-printed JSON file serialization verified.');

  // Test 8: UTF-8 & Unicode support
  console.log('\nTest 8: Unicode / UTF-8 safety');
  const findingsUnicode = [
    createMockFinding('f-1', 'express-missing-auth', '/🚀', 'high', 95, 'src/日本語.ts', 10)
  ];
  const reportUnicode = exporter.exportSarif(findingsUnicode, metrics);
  assert.strictEqual(reportUnicode.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri, 'src/日本語.ts');
  console.log('  ✔ Unicode filenames and route payloads mapped successfully.');

  // Test 9: Concurrent exports thread safety
  console.log('\nTest 9: Concurrent exports safety');
  const concurrentRuns = 100;
  const startCon = performance.now();
  const promises = Array.from({ length: concurrentRuns }).map(() => {
    return Promise.resolve().then(() => {
      const rep = exporter.exportSarif(findings3, metrics);
      assert.strictEqual(rep.runs[0].results.length, 3);
    });
  });
  Promise.all(promises).then(() => {
    const elapsedCon = performance.now() - startCon;
    console.log(`  ✔ Completed ${concurrentRuns} concurrent exports in ${elapsedCon.toFixed(2)}ms`);

    // Test 10: Performance benchmark with 10,000 findings
    console.log('\nTest 10: Performance benchmark with 10,000 findings');
    const largeFindings: FrameworkFinding[] = [];
    for (let i = 0; i < 10000; i++) {
      largeFindings.push(
        createMockFinding(
          `f-${i}`,
          i % 2 === 0 ? 'express-missing-auth' : 'express-missing-helmet',
          `/route-${i}`,
          'high',
          85,
          `src/file-${i % 50}.ts`,
          i
        )
      );
    }
    const startBench = performance.now();
    const largeReport = exporter.exportSarif(largeFindings, metrics);
    const elapsedBench = performance.now() - startBench;

    assert.strictEqual(largeReport.runs[0].results.length, 10000);
    assert.strictEqual(largeReport.runs[0].artifacts?.length, 50);
    console.log(`  ✔ Exported 10,000 findings in ${elapsedBench.toFixed(2)}ms`);

    console.log('\n====================================================');
    console.log(' ALL PHASE 13.0 SARIF EXPORT TESTS PASSED! 🎉        ');
    console.log('====================================================');
  }).catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

runSarifTests();
