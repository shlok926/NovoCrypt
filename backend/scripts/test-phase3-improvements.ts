import assert from 'assert';
import { AesDetector } from '../src/services/scanner/detectors/aes-detector';
import { PqcDetector } from '../src/services/scanner/detectors/pqc-detector';
import { JwtDetector } from '../src/services/scanner/detectors/jwt-detector';
import { EccDetector } from '../src/services/scanner/detectors/ecc-detector';
import { TlsX509Detector } from '../src/services/scanner/detectors/tls-x509-detector';
import { ScanContext, SupportLevel, DetectionSupport } from '../src/services/scanner/types';
import { PathFilter } from '../src/services/scanner/utils/filtering/pathFilter';
import { StringResolver } from '../src/services/scanner/utils/resolver/stringResolver';
import { DetectionContextBuilder } from '../src/services/scanner/utils/context/DetectionContextBuilder';

async function runPhase3Tests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 3 Detection Improvements Test Suite');
  console.log('====================================================\n');

  // 1. PathFilter Classification & Suppression Tests
  console.log('Test 1: PathFilter Classification & Suppression');
  const prodClass = PathFilter.classify('src/crypto/encrypt.ts');
  assert.strictEqual(prodClass.isProductionFile, true);
  assert.strictEqual(prodClass.category, 'production');

  const docClass = PathFilter.classify('README.md');
  assert.strictEqual(docClass.isDocumentation, true);
  assert.strictEqual(docClass.category, 'documentation');

  const testClass = PathFilter.classify('tests/fixtures/crypto.spec.ts');
  assert.strictEqual(testClass.isTestFile, true);
  assert.strictEqual(testClass.category, 'test');

  const buildClass = PathFilter.classify('dist/bundle.js');
  assert.strictEqual(buildClass.isGenerated, true);
  assert.strictEqual(buildClass.category, 'build');
  console.log('  ✔ PathFilter accurately classifies production, doc, test, and build targets.');

  // 2. StringResolver Non-Mutating Resolution Tests
  console.log('\nTest 2: Non-Mutating StringResolver');
  const sampleCode = `
    const mode = "256";
    const cipher = \`AES-\${mode}-GCM\`;
    const algo = "AES-" + mode + "-GCM";
  `;

  const vars = StringResolver.extractVariables(sampleCode);
  assert.strictEqual(vars.get('mode'), '256');

  const resolvedLiteral = StringResolver.resolveLine('const cipher = `AES-${mode}-GCM`;', vars);
  assert.strictEqual(resolvedLiteral.isResolved, true);
  assert.strictEqual(resolvedLiteral.original, 'const cipher = `AES-${mode}-GCM`;');
  assert.strictEqual(resolvedLiteral.resolved, 'const cipher = "AES-256-GCM";');

  const resolvedConcat = StringResolver.resolveLine('const algo = "AES-" + mode + "-GCM";', vars);
  assert.strictEqual(resolvedConcat.isResolved, true);
  assert.strictEqual(resolvedConcat.original, 'const algo = "AES-" + mode + "-GCM";');
  assert.strictEqual(resolvedConcat.resolved, 'const algo = "AES-256-GCM";');
  console.log('  ✔ StringResolver resolves template literals & concatenations without mutating source.');

  // 3. Unified DetectionContextBuilder Test
  console.log('\nTest 3: DetectionContextBuilder Construction');
  const context = new ScanContext({
    targetType: 'code',
    target: sampleCode,
    fileName: 'src/cipher.ts',
    language: 'typescript'
  });

  const detContext = DetectionContextBuilder.build(context);
  assert.strictEqual(detContext.language, 'typescript');
  assert.strictEqual(detContext.pathClassification.isProductionFile, true);
  assert.strictEqual(detContext.resolvedStrings.size > 0, true);
  console.log('  ✔ DetectionContextBuilder creates a unified DetectionContext object.');

  // 4. Configurable Path Filtering Modes Test
  console.log('\nTest 4: Configurable Path Filtering Modes');
  const aesDetector = new AesDetector();
  const docCertSnippet = `const mode = "ECB"; const c = \`AES-256-\${mode}\`;`;

  // Enterprise mode (default): documentation file suppressed
  const resEnt = await aesDetector.detect(new ScanContext({
    targetType: 'code',
    target: docCertSnippet,
    fileName: 'README.md',
    language: 'markdown'
  }));
  assert.strictEqual(resEnt.length, 0, 'Enterprise mode suppresses findings in README.md');

  // Strict mode: scans documentation file without suppression
  const resStrict = await aesDetector.detect(new ScanContext({
    targetType: 'code',
    target: docCertSnippet,
    fileName: 'README.md',
    language: 'markdown',
    configuration: {
      pathFiltering: { mode: 'strict' }
    }
  }));
  assert(resStrict.length > 0, 'Strict mode scans documentation files successfully');

  // Test mode confidence downgrade check
  const resTestFile = await aesDetector.detect(new ScanContext({
    targetType: 'code',
    target: docCertSnippet,
    fileName: 'tests/crypto.spec.ts',
    language: 'typescript'
  }));
  assert(resTestFile.length > 0, 'Test file scanned in enterprise mode');
  assert(resTestFile[0].confidenceExplanation.reason.includes('Reduced: test/fixture path'), 'Confidence explanation notes test path adjustment');
  console.log('  ✔ Enterprise vs Strict path filtering modes function correctly.');

  // 5. Template Literal & Concatenation Detection Verification
  console.log('\nTest 5: Detector Template Literal & Concatenation Detection');
  const templateCode = `
    const mode = "ECB";
    const cipher1 = \`AES-256-\${mode}\`;
    const cipher2 = "AES-128-" + mode;
  `;

  const resTemplate = await aesDetector.detect(new ScanContext({
    targetType: 'code',
    target: templateCode,
    fileName: 'src/encrypt.ts',
    language: 'typescript'
  }));

  assert(resTemplate.some(f => f.ruleId === 'AES001'), 'Template literal AES-256-ECB triggers AES001');
  console.log('  ✔ AES detector resolves template literals and string concatenations dynamically.');

  // 6. Metadata Matrices Verification
  console.log('\nTest 6: Detector Metadata Matrices (Capabilities, LanguageMatrix, BypassMatrix)');
  const detectors = [
    new AesDetector(),
    new PqcDetector(),
    new JwtDetector(),
    new EccDetector(),
    new TlsX509Detector()
  ];

  for (const d of detectors) {
    assert(d.capabilities !== undefined, `${d.name} exposes capabilities`);
    assert(d.languageMatrix !== undefined, `${d.name} exposes languageMatrix`);
    assert(d.bypassMatrix !== undefined, `${d.name} exposes bypassMatrix`);
    assert(d.languageMatrix!.languages.every(l => l.supportLevel === SupportLevel.FULL || l.supportLevel === SupportLevel.PARTIAL));
    assert(d.bypassMatrix!.regex === DetectionSupport.FULL);
    assert(d.bypassMatrix!.templateLiterals === DetectionSupport.FULL);
    assert(d.bypassMatrix!.factories === DetectionSupport.AST_REQUIRED);
  }
  console.log('  ✔ All 5 enterprise detectors expose standardized capabilities, language, and bypass matrices.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 3 DETECTION IMPROVEMENT TESTS PASSED! 🎉');
  console.log('====================================================');
}

runPhase3Tests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
