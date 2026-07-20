import { EccDetector } from '../src/services/scanner/detectors/ecc-detector';
import { ScanContext } from '../src/services/scanner/types';

console.log('🧪 Starting ECC/ECDSA Enterprise Security Analyzer Regression Test Suite...\n');

async function runTests() {
  const detector = new EccDetector();
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

  // Test Case 1: Weak curves (< 224 bits) - secp160r1 (Java)
  const weakCodeJava = `
    import java.security.KeyPairGenerator;
    import java.security.spec.ECGenParameterSpec;
    
    KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
    kpg.initialize(new ECGenParameterSpec("secp160r1"));
  `;
  const findingsWeakJava = await detector.detect({
    targetType: 'code',
    target: weakCodeJava,
    fileName: 'CryptoUtils.java',
    language: 'java'
  });
  assert(findingsWeakJava.some(f => f.ruleId === 'ECC001'), 'Weak curve secp160r1 triggers ECC001');

  // Test Case 2: Deprecated Curves - secp256k1 (JS/TS)
  const depCodeJs = `
    const crypto = require('crypto');
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1'
    });
  `;
  const findingsDepJs = await detector.detect({
    targetType: 'code',
    target: depCodeJs,
    fileName: 'auth.ts',
    language: 'typescript'
  });
  assert(findingsDepJs.some(f => f.ruleId === 'ECC002'), 'Deprecated curve secp256k1 triggers ECC002');

  // Test Case 3: Modern Secure Curve - NIST P-256 (C#)
  const secureCodeCs = `
    using System.Security.Cryptography;
    ECDsa ecdsa = ECDsa.Create(ECCurve.NamedCurves.nistP256);
  `;
  const findingsSecureCs = await detector.detect({
    targetType: 'code',
    target: secureCodeCs,
    fileName: 'Crypto.cs',
    language: 'csharp'
  });
  // Should trigger quantum migration (ECCM001) as info/recommendation
  assert(findingsSecureCs.some(f => f.ruleId === 'ECCM001'), 'Modern secure NIST P-256 triggers quantum migration recommendation ECCM001');
  // Should NOT trigger security vulnerabilities (ECC001 or ECC002)
  assert(!findingsSecureCs.some(f => f.ruleId === 'ECC001' || f.ruleId === 'ECC002'), 'Modern secure NIST P-256 does NOT trigger vulnerability findings');

  // Test Case 4: Modern Secure Curve - Curve25519 (Go)
  const secureCodeGo = `
    import "golang.org/x/crypto/curve25519"
    // Curve25519 key exchange
  `;
  const findingsSecureGo = await detector.detect({
    targetType: 'code',
    target: secureCodeGo,
    fileName: 'exchange.go',
    language: 'go'
  });
  assert(findingsSecureGo.some(f => f.ruleId === 'ECCM001'), 'Curve25519 triggers quantum migration recommendation ECCM001');

  // Test Case 5: Ed25519 (Go/Rust)
  const secureCodeRust = `
    use ring::signature::Ed25519KeyPair;
    let key_bytes = Ed25519KeyPair::generate_pkcs8(&ring::rand::SystemRandom::new())?;
  `;
  const findingsSecureRust = await detector.detect({
    targetType: 'code',
    target: secureCodeRust,
    fileName: 'lib.rs',
    language: 'rust'
  });
  assert(findingsSecureRust.some(f => f.ruleId === 'ECCM001'), 'Ed25519 triggers quantum migration recommendation ECCM001');

  // Test Case 6: Brainpool Curves (Java/BouncyCastle)
  const brainpoolCode = `
    ECGenParameterSpec ecSpec = new ECGenParameterSpec("brainpoolp256r1");
  `;
  const findingsBrainpool = await detector.detect({
    targetType: 'code',
    target: brainpoolCode,
    fileName: 'Config.java',
    language: 'java'
  });
  assert(findingsBrainpool.some(f => f.ruleId === 'ECCM001'), 'Brainpool curve triggers quantum migration recommendation ECCM001');

  // Test Case 7: API Misuse - Static Nonce
  const staticNonceCode = `
    const nonce = "a1b2c3d4e5f60708";
    const signature = ecdsa.sign(message, nonce);
  `;
  const findingsNonce = await detector.detect({
    targetType: 'code',
    target: staticNonceCode,
    fileName: 'sign.js',
    language: 'javascript'
  });
  assert(findingsNonce.some(f => f.ruleId === 'ECC003'), 'Static nonce assignment triggers ECC003');

  // Test Case 8: API Misuse - Custom Curve
  const customCurveCode = `
    var spec = new ECParameterSpec(ellipticCurve, g, n, h);
  `;
  const findingsCustom = await detector.detect({
    targetType: 'code',
    target: customCurveCode,
    fileName: 'CustomCrypto.java',
    language: 'java'
  });
  assert(findingsCustom.some(f => f.ruleId === 'ECC003'), 'Custom curve instantiation triggers ECC003');

  // Test Case 9: Unsafe Default
  const unsafeDefaultCode = `
    KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
    // missing initialize!
    KeyPair kp = kpg.generateKeyPair();
  `;
  const findingsDefault = await detector.detect({
    targetType: 'code',
    target: unsafeDefaultCode,
    fileName: 'Keys.java',
    language: 'java'
  });
  assert(findingsDefault.some(f => f.ruleId === 'ECC003'), 'Missing KeyPairGenerator initialize triggers ECC003');

  // Test Case 10: Signature Weak Hash (SHA-1)
  const weakHashCode = `
    Signature sig = Signature.getInstance("SHA1withECDSA");
  `;
  const findingsHash = await detector.detect({
    targetType: 'code',
    target: weakHashCode,
    fileName: 'Sign.java',
    language: 'java'
  });
  assert(findingsHash.some(f => f.ruleId === 'ECC004'), 'SHA-1 hash with ECDSA triggers ECC004');

  // Test Case 11: Keygen Weak Random
  const weakRandomCode = `
    SecureRandom sr = new SecureRandom(new byte[] { 1, 2, 3 });
    kpg.initialize(ecSpec, sr);
  `;
  const findingsRandom = await detector.detect({
    targetType: 'code',
    target: weakRandomCode,
    fileName: 'KeyGenerator.java',
    language: 'java'
  });
  assert(findingsRandom.some(f => f.ruleId === 'ECC005'), 'Predictable SecureRandom seed triggers ECC005');

  // Test Case 12: False Positive Suppression (Comments)
  const commentCode = `
    // We should not use secp160r1 curve anymore.
    # KeyPairGenerator kpg = KeyPairGenerator.getInstance("EC");
  `;
  const findingsComments = await detector.detect({
    targetType: 'code',
    target: commentCode,
    fileName: 'Comment.java',
    language: 'java'
  });
  assert(findingsComments.length === 0, 'Comment lines do not trigger findings (false positive suppression)');

  // Test Case 13: Evidence Completeness & Confidence Audit
  const checkEvidence = findingsWeakJava.find(f => f.ruleId === 'ECC001');
  if (checkEvidence && checkEvidence.evidence) {
    const ev = checkEvidence.evidence as any;
    assert(ev.curveName === 'secp160r1', 'Evidence captures curve name correctly');
    assert(ev.oid === '1.3.132.0.9', 'Evidence captures OID correctly');
    assert(ev.keySize === 160, 'Evidence captures key size correctly');
    assert(ev.confidence === 95, 'Evidence confidence score is calculated correctly based on API context');
  } else {
    assert(false, 'Evidence fields are not populated');
  }

  // --- SUMMARY ---
  console.log(`\n=== ECC Security Analyzer Test Summary ===`);
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
