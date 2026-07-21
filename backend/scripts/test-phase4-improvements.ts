import assert from 'assert';
import { JwtDetector } from '../src/services/scanner/detectors/jwt-detector';
import { ScanContext } from '../src/services/scanner/types';

async function runPhase4Tests() {
  console.log('====================================================');
  console.log(' NovoCrypt Phase 4 Finding Limit Guard Test Suite   ');
  console.log('====================================================\n');

  const jwtDetector = new JwtDetector();

  // Code snippet generating 10 hardcoded JWT secret findings
  const repeatSecretsCode = Array.from({ length: 10 }, (_, i) => `const jwtSecret = "super_secret_jwt_key_string_${i}";`).join('\n');

  // Test 1: Positive Case (Exceeding maxFindingsPerFile Limit)
  console.log('Test 1: Truncation when findings exceed configured limit');
  const contextExceeding = new ScanContext({
    targetType: 'code',
    target: repeatSecretsCode,
    fileName: 'src/secrets.ts',
    language: 'typescript',
    executionOptions: {
      maxFindingsPerFile: 3
    }
  });

  const resTruncated = await jwtDetector.detect(contextExceeding);
  assert.strictEqual(resTruncated.length, 3, 'Returned findings count equals configured limit of 3');
  
  const truncationMeta = resTruncated[0].truncation;
  assert(truncationMeta !== undefined, 'Truncation metadata is attached to findings');
  assert.strictEqual(truncationMeta.truncated, true, 'truncated is true');
  assert.strictEqual(truncationMeta.limit, 3, 'limit is 3');
  assert.strictEqual(truncationMeta.totalGenerated, 10, 'totalGenerated is 10');
  assert.strictEqual(truncationMeta.findingsDropped, 7, 'findingsDropped is 7');
  console.log('  ✔ Correctly truncates findings to configured limit (3 returned, 7 dropped) and attaches TruncationMetadata.');

  // Test 2: Negative Case (Below maxFindingsPerFile Limit)
  console.log('\nTest 2: Normal execution when findings are within limit');
  const smallCode = `
    const jwtSecret = "super_secret_jwt_key_string_1";
    const jwtSecret = "super_secret_jwt_key_string_2";
  `;

  const contextNormal = new ScanContext({
    targetType: 'code',
    target: smallCode,
    fileName: 'src/config.ts',
    language: 'typescript',
    executionOptions: {
      maxFindingsPerFile: 10
    }
  });

  const resNormal = await jwtDetector.detect(contextNormal);
  assert.strictEqual(resNormal.length, 2, 'Returned findings count equals total generated (2)');
  assert.strictEqual(resNormal[0].truncation, undefined, 'No truncation metadata attached when under limit');
  console.log('  ✔ Returns all findings without truncation or metadata when under limit.');

  // Test 3: Default Limit Verification (50)
  console.log('\nTest 3: Default maxFindingsPerFile limit (50)');
  const contextDefault = new ScanContext({
    targetType: 'code',
    target: smallCode,
    fileName: 'src/app.ts',
    language: 'typescript'
  });
  assert.strictEqual(contextDefault.executionOptions.maxFindingsPerFile, 50, 'Default maxFindingsPerFile is 50');
  console.log('  ✔ Default maxFindingsPerFile is configured to 50.');

  console.log('\n====================================================');
  console.log(' ALL PHASE 4 FINDING LIMIT GUARD TESTS PASSED! 🎉   ');
  console.log('====================================================');
}

runPhase4Tests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
