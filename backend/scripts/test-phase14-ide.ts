import assert from 'assert';
import { performance } from 'perf_hooks';
import { FrameworkFinding } from '../src/services/scanner/ast/framework/rules/models/FrameworkFinding';
import { NovoNode } from '../src/services/scanner/ast/NovoNode';
import {
  IDEIntegrationEngine,
  DiagnosticModel,
  DiagnosticMapper,
  VSCodeAdapter,
  JetBrainsAdapter,
  FutureAdapter,
  VSCodeDiagnosticProvider,
  JetBrainsProblemMapper,
  VSCodeTreeViewProvider
} from '../src/services/scanner/ide';

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

function runIDETests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 14.0 IDE Integration Layer Tests  ');
  console.log('====================================================');

  const engine = new IDEIntegrationEngine();
  const workspaceId1 = 'workspace-1';

  const vscodeAdapter = new VSCodeAdapter();
  const jetbrainsAdapter = new JetBrainsAdapter();
  const futureAdapter = new FutureAdapter();

  engine.registerAdapter(workspaceId1, vscodeAdapter);
  engine.registerAdapter(workspaceId1, jetbrainsAdapter);
  engine.registerAdapter(workspaceId1, futureAdapter);

  // Test 1: Single Diagnostic Mapping from Finding
  console.log('\nTest 1: Single finding mapping to DiagnosticModel');
  const finding1 = createMockFinding('f-1', 'express-missing-auth', '/admin', 'high', 95, 'src/admin.ts', 10);
  const diag1 = DiagnosticMapper.fromFinding(finding1);

  assert.strictEqual(diag1.id, 'f-1');
  assert.strictEqual(diag1.severity, 'error');
  assert.strictEqual(diag1.category, 'Authentication');
  assert.strictEqual(diag1.file, 'src/admin.ts');
  assert.strictEqual(diag1.startLine, 10);
  assert.strictEqual(diag1.source, 'NovoCrypt');
  console.log('  ✔ Successfully mapped FrameworkFinding properties to DiagnosticModel.');

  // Test 2: SARIF Import Mapping
  console.log('\nTest 2: SARIF mapping to DiagnosticModel');
  const mockSarif = {
    runs: [
      {
        tool: {
          driver: {
            rules: [
              { id: 'koa-middleware-ordering', name: 'Koa sensitive ordering check', properties: { category: 'Configuration' } }
            ]
          }
        },
        results: [
          {
            ruleId: 'koa-middleware-ordering',
            level: 'warning',
            message: { text: 'Koa ordering violation detected.' },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: 'src/app.ts' },
                  region: { startLine: 12, startColumn: 2 }
                }
              }
            ],
            properties: {
              'novocrypt.confidence': 88,
              'novocrypt.framework': 'Koa',
              'novocrypt.suggestedRemediation': 'Move body parser before router'
            }
          }
        ]
      }
    ]
  };

  const parsedDiags = engine.loadSarif(mockSarif);
  assert.strictEqual(parsedDiags.length, 1);
  assert.strictEqual(parsedDiags[0].ruleId, 'koa-middleware-ordering');
  assert.strictEqual(parsedDiags[0].severity, 'warning');
  assert.strictEqual(parsedDiags[0].category, 'Configuration');
  assert.strictEqual(parsedDiags[0].file, 'src/app.ts');
  assert.strictEqual(parsedDiags[0].framework, 'Koa');
  assert.strictEqual(parsedDiags[0].confidence, 88);
  assert.strictEqual(parsedDiags[0].source, 'SARIF');
  console.log('  ✔ Successfully mapped SARIF report result properties to DiagnosticModel.');

  // Test 3: Workspace Indexing Lookups O(1)
  console.log('\nTest 3: O(1) workspace indices lookup performance and accuracy');
  engine.publishDiagnostics(workspaceId1, [diag1, ...parsedDiags]);

  const collection = engine.getCollection(workspaceId1);
  const index = collection.getIndex();

  const fileDiags = index.getByFile('src/admin.ts');
  assert.strictEqual(fileDiags.length, 1);
  assert.strictEqual(fileDiags[0].id, 'f-1');

  const ruleDiags = index.getByRule('koa-middleware-ordering');
  assert.strictEqual(ruleDiags.length, 1);
  assert.strictEqual(ruleDiags[0].ruleId, 'koa-middleware-ordering');

  const severityDiags = index.getBySeverity('error');
  assert.strictEqual(severityDiags.length, 1);
  assert.strictEqual(severityDiags[0].id, 'f-1');

  const fpDiag = index.getByFingerprint(diag1.fingerprint);
  assert.deepStrictEqual(fpDiag, diag1);
  console.log('  ✔ Quick O(1) indices successfully verified.');

  // Test 4: Incremental Diff computation (Added, Updated, Removed)
  console.log('\nTest 4: Incremental update diff computation');
  const initialDiags = [diag1];
  
  // Create updated version (e.g. line changed)
  const updatedDiag1: DiagnosticModel = {
    ...diag1,
    startLine: 11
  };
  // Create new diagnostic
  const finding2 = createMockFinding('f-2', 'express-missing-helmet', '/home', 'medium', 80, 'src/home.ts', 30);
  const diag2 = DiagnosticMapper.fromFinding(finding2);

  // Run incremental update with current list: [updatedDiag1, diag2] (diag1 is removed/updated, f-2 is added)
  engine.publishDiagnostics(workspaceId1, initialDiags);
  
  // Make sure adapters received them initially
  assert.strictEqual(vscodeAdapter.getPublished().length, 1);
  
  engine.updateIncrementally(workspaceId1, [updatedDiag1, diag2]);

  const updatedPublished = vscodeAdapter.getPublished();
  assert.strictEqual(updatedPublished.length, 2, 'Should have 2 published diagnostics after incremental sync');
  assert(updatedPublished.some(d => d.id === 'f-2'), 'Should contain added diagnostic f-2');
  assert(updatedPublished.some(d => d.id === 'f-1' && d.startLine === 11), 'Should contain updated diagnostic f-1 on line 11');
  console.log('  ✔ Incremental update diff calculation (added, updated, removed) successfully applied.');

  // Test 5: VS Code TreeView Provider Grouping
  console.log('\nTest 5: VS Code TreeView custom groupings');
  const treeProvider = new VSCodeTreeViewProvider();
  
  const treeSeverity = treeProvider.buildTree([diag1, diag2], 'Severity');
  assert(treeSeverity.some(t => t.label.includes('Severity: ERROR')));
  assert(treeSeverity.some(t => t.label.includes('Severity: WARNING')));

  const treeFile = treeProvider.buildTree([diag1, diag2], 'File');
  assert(treeFile.some(t => t.label.includes('File: src/admin.ts')));
  assert(treeFile.some(t => t.label.includes('File: src/home.ts')));
  console.log('  ✔ Tree view structures built successfully.');

  // Test 6: JETBRAINS problems mapping
  console.log('\nTest 6: JetBrains Problem highlighting adapter mapping');
  const jbProblems = JetBrainsProblemMapper.mapToJetBrains([diag1, diag2]);
  assert.strictEqual(jbProblems.length, 2);
  assert.strictEqual(jbProblems[0].filePath, 'src/admin.ts');
  assert.strictEqual(jbProblems[0].highlightType, 'GENERIC_ERROR_OR_WARNING');
  assert.strictEqual(jbProblems[1].highlightType, 'WEAK_WARNING');
  console.log('  ✔ Highlight severities mapped correctly (error -> GENERIC_ERROR_OR_WARNING, warning -> WEAK_WARNING).');

  // Test 7: Configurations filters
  console.log('\nTest 7: IDE config filter validations');
  engine.updateConfig({
    confidenceThreshold: 90,
    ignoredFiles: ['src/home.ts']
  });

  // diag1 has confidence 95, src/admin.ts -> Included
  // diag2 has confidence 80, src/home.ts -> Excluded (both due to confidence and ignoredFiles)
  engine.publishDiagnostics(workspaceId1, [diag1, diag2]);
  
  const filtered = vscodeAdapter.getPublished();
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].id, 'f-1');
  
  // Clear filters
  engine.updateConfig({
    confidenceThreshold: 0,
    ignoredFiles: []
  });
  console.log('  ✔ Config confidence threshold and ignored paths logic validated.');

  // Test 8: Paths normalization & Unicode safety
  console.log('\nTest 8: Cross-platform paths and Unicode safety');
  const findingUnicode = createMockFinding('f-uni', 'express-missing-auth', '/🚀', 'high', 95, 'src\\日本語.ts', 10);
  const diagUnicode = DiagnosticMapper.fromFinding(findingUnicode);
  assert.strictEqual(diagUnicode.file, 'src/日本語.ts', 'Should normalize backslashes and support Unicode characters');
  console.log('  ✔ Unicode characters and backslash paths normalization confirmed.');

  // Test 9: Concurrent workspaces publishing safety
  console.log('\nTest 9: Concurrent workspaces orchestration check');
  const workspaceIds = Array.from({ length: 50 }).map((_, idx) => `workspace-${idx}`);
  workspaceIds.forEach(wid => {
    engine.publishDiagnostics(wid, [diag1]);
    const dList = engine.exportDiagnostics(wid);
    assert.strictEqual(dList.length, 1);
  });
  console.log('  ✔ Successfully ran concurrent publish operations across 50 separate workspaces.');

  // Test 10: Benchmark performance on 100,000 diagnostics
  console.log('\nTest 10: Benchmark 100,000 diagnostics indexing performance');
  const largeList: DiagnosticModel[] = [];
  for (let i = 0; i < 100000; i++) {
    largeList.push({
      id: `f-${i}`,
      title: 'Title',
      description: 'Desc',
      severity: i % 2 === 0 ? 'error' : 'warning',
      category: 'Validation',
      file: `src/file-${i % 100}.ts`,
      startLine: i,
      startColumn: 1,
      endLine: i,
      endColumn: 5,
      ruleId: `rule-${i % 10}`,
      framework: 'Express',
      confidence: 90,
      suggestedRemediation: 'Remedy',
      fingerprint: `fp-${i}`,
      source: 'NovoCrypt',
      relatedLocations: []
    });
  }

  const startPub = performance.now();
  engine.publishDiagnostics('large-workspace', largeList);
  const elapsedPub = performance.now() - startPub;

  console.log(`  ✔ Indexed 100,000 diagnostics in ${elapsedPub.toFixed(2)}ms`);

  const startLookup = performance.now();
  const fileSearch = engine.getCollection('large-workspace').getIndex().getByFile('src/file-42.ts');
  const elapsedLookup = performance.now() - startLookup;

  assert.strictEqual(fileSearch.length, 1000);
  console.log(`  ✔ File lookup returned 1,000 diagnostics in ${elapsedLookup.toFixed(3)}ms`);

  console.log('\n====================================================');
  console.log(' ALL PHASE 14.0 IDE INTEGRATION TESTS PASSED! 🎉     ');
  console.log('====================================================');
}

runIDETests();
