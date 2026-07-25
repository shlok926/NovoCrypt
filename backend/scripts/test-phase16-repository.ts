import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import {
  RepositoryEngine,
  RepositoryEvents,
  FileFingerprint,
  WorkspaceLoader,
  LanguageDetector,
  IgnoreMatcher,
  DependencyGraph,
  WorkspaceGraph,
  CrossFileResolver
} from '../src/services/scanner/repository';

const TEMP_WS_DIR = path.resolve(__dirname, 'temp-workspace');

function setupTempWorkspace() {
  if (fs.existsSync(TEMP_WS_DIR)) {
    fs.rmSync(TEMP_WS_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEMP_WS_DIR, { recursive: true });
  fs.mkdirSync(path.join(TEMP_WS_DIR, 'src/api'), { recursive: true });
  fs.mkdirSync(path.join(TEMP_WS_DIR, 'src/services'), { recursive: true });
  fs.mkdirSync(path.join(TEMP_WS_DIR, '.ignored_folder'), { recursive: true });

  // 1. Write auth.ts (exports verifyToken)
  fs.writeFileSync(
    path.join(TEMP_WS_DIR, 'src/services/auth.ts'),
    `export function verifyToken(token: string) {
       return token === "valid-token";
     }`
  );

  // 2. Write user.ts (imports verifyToken, contains call expression)
  fs.writeFileSync(
    path.join(TEMP_WS_DIR, 'src/api/user.ts'),
    `import { verifyToken } from "../services/auth";
     export function getUserInfo(t: string) {
       const isValid = verifyToken(t);
       return { user: "admin", active: isValid };
     }`
  );

  // 3. Write server.ts (imports getUserInfo)
  fs.writeFileSync(
    path.join(TEMP_WS_DIR, 'src/server.ts'),
    `import { getUserInfo } from "./api/user";
     getUserInfo("dummy-token");`
  );

  // 4. Write .gitignore
  fs.writeFileSync(
    path.join(TEMP_WS_DIR, '.gitignore'),
    `# Gitignore file
     .ignored_folder/
     dist/
     node_modules/
    `
  );

  // 5. Write an ignored file inside .ignored_folder
  fs.writeFileSync(
    path.join(TEMP_WS_DIR, '.ignored_folder/secret.ts'),
    `export const key = "unreachable";`
  );
}

function cleanupTempWorkspace() {
  if (fs.existsSync(TEMP_WS_DIR)) {
    fs.rmSync(TEMP_WS_DIR, { recursive: true, force: true });
  }
}

async function runRepositoryTests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 16.0 Whole Repository Analysis Tests');
  console.log('====================================================');

  setupTempWorkspace();

  try {
    const engine = new RepositoryEngine({
      cacheEnabled: true,
      workerCount: 4
    });

    // Test 1: Repository Discovery & Language Detection
    console.log('\nTest 1: Repository discovery and ignore files handling');
    const report1 = await engine.scanRepository(TEMP_WS_DIR);

    assert.strictEqual(report1.metrics.filesScanned, 3, 'Should discover exactly 3 source files (auth.ts, user.ts, server.ts)');
    assert.strictEqual(report1.languageStatistics.typescript, 3, 'All 3 files should be detected as typescript');
    assert(report1.workspaceSummary.root.includes('temp-workspace'), 'Root path should include temp-workspace');
    console.log('  ✔ Repository Discovery completed correctly.');

    // Test 2: Dependency Graph & Workspace Graph
    console.log('\nTest 2: Workspace graph and dependency indexes');
    const dependencyGraph = (engine as any).activeWorkspace.dependencyGraph;
    assert(dependencyGraph instanceof DependencyGraph);

    const userDeps = dependencyGraph.getDirectDependencies(path.join(TEMP_WS_DIR, 'src/api/user.ts').replace(/\\/g, '/'));
    assert(userDeps.some((d: string) => d.endsWith('src/services/auth.ts')), 'user.ts should depend on auth.ts');

    const authDependents = dependencyGraph.getTransitiveDependents(path.join(TEMP_WS_DIR, 'src/services/auth.ts').replace(/\\/g, '/'));
    assert(authDependents.some((d: string) => d.endsWith('src/api/user.ts')), 'auth.ts dependent chain should include user.ts');
    assert(authDependents.some((d: string) => d.endsWith('src/server.ts')), 'auth.ts dependent chain should transitively include server.ts');
    console.log('  ✔ Dependency graph and transitives mapping validated successfully.');

    // Test 3: Incremental Rescans & Analysis Cache
    console.log('\nTest 3: Analysis cache and incremental scanner rescans');
    // Re-run scan with active cache
    const report2 = await engine.scanRepository(TEMP_WS_DIR);
    assert.strictEqual(report2.metrics.cacheHits, 3, 'Should get 100% cache hit rate on unchanged repository');

    // Trigger incremental rescan for modified user.ts
    const userFile = path.join(TEMP_WS_DIR, 'src/api/user.ts').replace(/\\/g, '/');
    const report3 = await engine.scanIncremental([userFile]);
    assert.strictEqual(report3.metrics.cacheHits, 1, 'Incremental updates should invalidate changed files and run cold parse');
    console.log('  ✔ Cache hit rates and incremental rescanning validated successfully.');

    // Test 4: Workspace Event System
    console.log('\nTest 4: Repository Events notification system');
    let scanCompletedEmitted = false;
    const unsub = RepositoryEvents.subscribe('ScanCompleted', (e) => {
      scanCompletedEmitted = true;
    });

    await engine.scanRepository(TEMP_WS_DIR);
    assert(scanCompletedEmitted, 'ScanCompleted event should be emitted');
    unsub();
    console.log('  ✔ Repository event triggers successfully dispatched.');

    // Test 5: Benchmark performance simulation of 1,000 files
    console.log('\nTest 5: Benchmark simulation on large repository tree');
    const largeRoot = path.join(TEMP_WS_DIR, 'large-sim');
    fs.mkdirSync(largeRoot, { recursive: true });

    for (let i = 0; i < 1000; i++) {
      fs.writeFileSync(
        path.join(largeRoot, `file-${i}.ts`),
        `export const val-${i} = ${i};`
      );
    }

    const startBench = performance.now();
    const benchReport = await engine.scanRepository(TEMP_WS_DIR);
    const elapsedBench = performance.now() - startBench;

    console.log(`  ✔ Discovered and parsed 1,000 simulated files in ${elapsedBench.toFixed(2)}ms`);
    assert(benchReport.metrics.filesScanned > 1000);

    console.log('\n====================================================');
    console.log(' ALL PHASE 16.0 REPOSITORY TESTS PASSED! 🎉         ');
    console.log('====================================================');
  } catch (err) {
    console.error('Test suite failed:', err);
    cleanupTempWorkspace();
    process.exit(1);
  }

  cleanupTempWorkspace();
}

runRepositoryTests();
