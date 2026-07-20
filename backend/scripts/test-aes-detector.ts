import { AesDetector } from '../src/services/scanner/detectors/aes-detector';
import { ScanContext } from '../src/services/scanner/types';

console.log('🧪 Starting AES Security Analyzer Regression Test Suite...\n');

async function runTests() {
  const detector = new AesDetector();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(` ✅ PASS: ${message}`);
      passed++;
    } else {
      console.log(` ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Helper to run scan
  const scan = async (code: string, fileName: string, language: string) => {
    return await detector.detect({
      targetType: 'code',
      target: code,
      fileName,
      language
    });
  };

  // Test Case 1: ECB Mode of Operation
  const ecbCode = `
    Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
  `;
  const res1 = await scan(ecbCode, 'Crypto.java', 'java');
  assert(res1.some(f => f.ruleId === 'AES001'), 'ECB mode triggers AES001');

  // Test Case 2: Static IV
  const staticIvCode = `
    const iv = "static_iv_value_12345";
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  `;
  const res2 = await scan(staticIvCode, 'encrypt.js', 'javascript');
  assert(res2.some(f => f.ruleId === 'AES002'), 'Static IV triggers AES002');

  // Test Case 3: Zero IV Usage
  const zeroIvCode = `
    const iv = Buffer.alloc(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  `;
  const res3 = await scan(zeroIvCode, 'encrypt.js', 'javascript');
  assert(res3.some(f => f.ruleId === 'AES003'), 'Zero IV triggers AES003');

  // Test Case 4: Hardcoded Symmetric Key
  const hardcodedKeyCode = `
    const aesKey = "this_is_a_hardcoded_cryptographic_secret_key";
  `;
  const res4 = await scan(hardcodedKeyCode, 'config.js', 'javascript');
  assert(res4.some(f => f.ruleId === 'AES005'), 'Hardcoded key triggers AES005');

  // Test Case 5: Weak AES Key Size
  const weakSizeCode = `
    const cipher = crypto.createCipheriv('aes-512-cbc', key, iv);
  `;
  const res5 = await scan(weakSizeCode, 'encrypt.js', 'javascript');
  assert(res5.some(f => f.ruleId === 'AES006'), 'Weak/Invalid key size triggers AES006');

  // Test Case 6: Weak Randomness Source
  const weakRandomCode = `
    const iv = Math.random();
  `;
  const res6 = await scan(weakRandomCode, 'encrypt.js', 'javascript');
  assert(res6.some(f => f.ruleId === 'AES007'), 'Math.random triggers AES007');

  // Test Case 7: Unauthenticated Encryption Mode
  const unauthCode = `
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  `;
  const res7 = await scan(unauthCode, 'encrypt.js', 'javascript');
  assert(res7.some(f => f.ruleId === 'AES008'), 'CBC mode triggers AES008');

  // Test Case 8: Weak PBKDF2 iteration count
  const weakPbkdf2Code = `
    crypto.pbkdf2(password, salt, 1000, 64, 'sha256', (err, key) => {});
  `;
  const res8 = await scan(weakPbkdf2Code, 'auth.js', 'javascript');
  assert(res8.some(f => f.ruleId === 'AES010'), 'Low PBKDF2 iteration count triggers AES010');

  // Test Case 9: Weak Argon2 memory
  const weakArgonCode = `
    argon2.hash(password, { memoryCost: 4096 });
  `;
  const res9 = await scan(weakArgonCode, 'auth.js', 'javascript');
  assert(res9.some(f => f.ruleId === 'AES011'), 'Low Argon2 memory cost triggers AES011');

  // Test Case 10: Weak scrypt factor N
  const weakScryptCode = `
    crypto.scrypt(password, salt, 64, { N: 1024 }, (err, key) => {});
  `;
  const res10 = await scan(weakScryptCode, 'auth.js', 'javascript');
  assert(res10.some(f => f.ruleId === 'AES012'), 'Low scrypt cost factor N triggers AES012');

  // Test Case 11: Insecure Padding (ZeroPadding / NoPadding)
  const insecurePaddingCode = `
    Cipher cipher = Cipher.getInstance("AES/CBC/ZeroPadding");
  `;
  const res11 = await scan(insecurePaddingCode, 'Crypto.java', 'java');
  assert(res11.some(f => f.ruleId === 'AES015'), 'ZeroPadding triggers AES015');

  // Test Case 12: Padding Oracle Risk (PKCS7/5 used in CBC/unauthenticated setup)
  const pkcsPaddingCode = `
    Cipher cipher = Cipher.getInstance("AES/CBC/PKCS7Padding");
  `;
  const res12 = await scan(pkcsPaddingCode, 'Crypto.java', 'java');
  assert(res12.some(f => f.ruleId === 'AES014'), 'PKCS7/CBC triggers AES014 (Padding Oracle Risk)');

  // Test Case 13: Deprecated API (legacy createCipher)
  const deprecatedApiCode = `
    const cipher = crypto.createCipher('aes-256-cbc', key);
  `;
  const res13 = await scan(deprecatedApiCode, 'encrypt.js', 'javascript');
  assert(res13.some(f => f.ruleId === 'AES023'), 'Legacy createCipher triggers AES023');

  // Test Case 14: Constant Nonce usage
  const constantNonceCode = `
    const nonce = 9999999999;
  `;
  const res14 = await scan(constantNonceCode, 'encrypt.js', 'javascript');
  assert(res14.some(f => f.ruleId === 'AES017'), 'Constant nonce assignment triggers AES017');

  // Test Case 15: Weak KDF derivation hash
  const weakKdfHashCode = `
    crypto.pbkdf2(password, salt, 600000, 64, 'sha1', (err, key) => {});
  `;
  const res15 = await scan(weakKdfHashCode, 'auth.js', 'javascript');
  assert(res15.some(f => f.ruleId === 'AES018'), 'Weak SHA-1 hash for key derivation triggers AES018');

  // Test Case 16: Development/Test key constants
  const devKeyCode = `
    const aesKey = "test_key_temp_12345";
  `;
  const res16 = await scan(devKeyCode, 'config.js', 'javascript');
  assert(res16.some(f => f.ruleId === 'AES019'), 'Test/Dev key constants trigger AES019');

  // Test Case 17: Embedded Secret in configurations
  const embeddedSecretCode = `
    {
      "aes_key": "this_is_an_embedded_secret_inside_config"
    }
  `;
  const res17 = await scan(embeddedSecretCode, 'config.json', 'json');
  assert(res17.some(f => f.ruleId === 'AES020'), 'Embedded configuration secret triggers AES020');

  // Test Case 18: Weak AEAD authentication tag length
  const weakTagLengthCode = `
    const options = { authTagLength: 8 };
  `;
  const res18 = await scan(weakTagLengthCode, 'encrypt.js', 'javascript');
  assert(res18.some(f => f.ruleId === 'AES021'), 'authTagLength < 12 triggers AES021');

  // Test Case 19: Predictable salt KDF setup
  const predictableSaltCode = `
    const salt = "static_salt_value_for_testing";
  `;
  const res19 = await scan(predictableSaltCode, 'auth.js', 'javascript');
  assert(res19.some(f => f.ruleId === 'AES024'), 'Predictable/static salt triggers AES024');

  // Test Case 20: Library and import fingerprinting (Python PyCryptodome)
  const pyCode = `
    from Crypto.Cipher import AES
    cipher = AES.new(key, AES.MODE_ECB)
  `;
  const res20 = await scan(pyCode, 'encrypt.py', 'python');
  assert(res20.some(f => f.evidence.library === 'PyCryptodome' && f.evidence.language === 'python'), 'Fingerprints PyCryptodome Python code correctly');

  // Test Case 21: Library and import fingerprinting (Go crypto/aes)
  const goCode = `
    import "crypto/aes"
    const aes_key = "weak"
  `;
  const res21 = await scan(goCode, 'encrypt.go', 'go');
  assert(res21.some(f => f.evidence.library === 'Go crypto/aes' && f.evidence.language === 'go'), 'Fingerprints Go imports correctly');

  // Test Case 22: Cross-File Key Correlation
  // Setup: Hardcoded Key scanned in config.js (run in Test Case 4)
  // Action: Scan cipher initialization in verify.js. It correlates the secret definition from config.js.
  const cipherInitCode = `
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  `;
  const res22 = await scan(cipherInitCode, 'verify.js', 'javascript');
  const correlated = res22.find(f => f.ruleId === 'AES008');
  assert(correlated && correlated.evidence.confidence === 98 && (correlated.evidence as any).recommendation.includes('Correlated with symmetric key configured in config.js:'), 'Cross-file key correlation raises confidence score to 98%');

  // Test Case 23: Comment line suppression (False Positive check)
  const commentedCode = `
    // const aesKey = "this_should_be_suppressed";
    # const iv = "zero_iv_mocked";
  `;
  const res23 = await scan(commentedCode, 'encrypt.js', 'javascript');
  assert(res23.length === 0, 'Comment lines are ignored (false positive suppression)');

  // Test Case 24: Capabilities Metadata check
  assert(detector.capabilities.supportsAST === true, 'Symmetric capabilities supportAST is true');
  assert(detector.capabilities.supportsCrossFileCorrelation === true, 'Symmetric capabilities supportCrossFileCorrelation is true');

  // --- SUMMARY ---
  console.log(`\n=== AES Symmetric Security Analyzer Test Summary ===`);
  console.log(`Passed: ${passed}/${passed + failed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal testing error:', err);
  process.exit(1);
});
