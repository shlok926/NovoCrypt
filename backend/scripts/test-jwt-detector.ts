import { JwtDetector } from '../src/services/scanner/detectors/jwt-detector';
import { ScanContext } from '../src/services/scanner/types';

console.log('🧪 Starting JWT Security Analyzer Regression Test Suite...\n');

async function runTests() {
  const detector = new JwtDetector();
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

  // Test Case 1: Unsecured JWT (alg=none config)
  const unsecuredCode = `
    const signConfig = { alg: "none" };
    const token = jwt.sign(payload, key, signConfig);
  `;
  const res1 = await scan(unsecuredCode, 'auth.js', 'javascript');
  assert(res1.some(f => f.ruleId === 'JWT001'), 'alg=none triggers JWT001');

  // Test Case 2: Algorithm Confusion (verify without algorithm options)
  const confusionCode = `
    const verified = jwt.verify(token, publicKey);
  `;
  const res2 = await scan(confusionCode, 'auth.js', 'javascript');
  assert(res2.some(f => f.ruleId === 'JWT002'), 'Verification without algorithms list triggers JWT002');

  // Test Case 3: Decode without verify (Signature Bypass)
  const decodeCode = `
    const decoded = jwt.decode(token);
    // Missing jwt.verify call!
  `;
  const res3 = await scan(decodeCode, 'auth.js', 'javascript');
  assert(res3.some(f => f.ruleId === 'JWT003'), 'jwt.decode without verify triggers JWT003');

  // Test Case 4: Weak Secret (< 32 bytes)
  const weakSecretCode = `
    const jwtSecret = "weak_secret";
  `;
  const res4 = await scan(weakSecretCode, 'config.js', 'javascript');
  assert(res4.some(f => f.ruleId === 'JWT004' && f.evidence.snippet.includes('weak_secret')), 'HMAC secret < 32 bytes triggers JWT004 (Weak Secret)');

  // Test Case 5: Default Secret (placeholder)
  const defaultSecretCode = `
    const jwtSecret = "jwt_secret_key";
  `;
  const res5 = await scan(defaultSecretCode, 'config.js', 'javascript');
  assert(res5.some(f => f.ruleId === 'JWT004' && f.evidence.snippet.includes('jwt_secret_key')), 'HMAC default secret placeholder triggers JWT004');

  // Test Case 6: Hardcoded Secret (non-env variable string assign)
  const hardcodedCode = `
    const jwtSecret = "this_is_a_hardcoded_but_long_secret_value";
  `;
  const res6 = await scan(hardcodedCode, 'config.js', 'javascript');
  assert(res6.some(f => f.ruleId === 'JWT005'), 'Hardcoded secret string assignment triggers JWT005');

  // Test Case 7: Missing Expiration Claim in sign call
  const missingExpCode = `
    const token = jwt.sign({ sub: userId, role: "admin" }, secret);
  `;
  const res7 = await scan(missingExpCode, 'auth.js', 'javascript');
  assert(res7.some(f => f.ruleId === 'JWT006'), 'Missing expiration sign call triggers JWT006');

  // Test Case 8: Unsafe HTTP JWKS Endpoint
  const unsafeJwksCode = `
    const client = jwksClient({
      jwksUri: 'http://identity.enterprise.com/.well-known/jwks.json'
    });
  `;
  const res8 = await scan(unsafeJwksCode, 'auth.js', 'javascript');
  assert(res8.some(f => f.ruleId === 'JWT010'), 'Insecure HTTP JWKS endpoint triggers JWT010');

  // Test Case 9: Unsafe JWKS Caching settings
  const unsafeCacheCode = `
    const client = jwksClient({
      jwksUri: 'https://identity.enterprise.com/.well-known/jwks.json',
      cacheMaxAge: Infinity
    });
  `;
  const res9 = await scan(unsafeCacheCode, 'auth.js', 'javascript');
  assert(res9.some(f => f.ruleId === 'JWT010' && f.evidence.snippet.includes('cacheMaxAge: Infinity')), 'Infinite cacheMaxAge in JWKS client triggers JWT010');

  // Test Case 10: LocalStorage storage leakage
  const localStorageCode = `
    localStorage.setItem("jwt", token);
  `;
  const res10 = await scan(localStorageCode, 'client.js', 'javascript');
  assert(res10.some(f => f.ruleId === 'JWT012'), 'LocalStorage storage item triggers JWT012');

  // Test Case 11: SessionStorage storage leakage
  const sessionStorageCode = `
    sessionStorage.setItem("access_token", token);
  `;
  const res11 = await scan(sessionStorageCode, 'client.js', 'javascript');
  assert(res11.some(f => f.ruleId === 'JWT012'), 'SessionStorage storage item triggers JWT012');

  // Test Case 12: Insecure Cookie transport configurations
  const insecureCookieCode = `
    res.cookie('token', token, { domain: 'novocrypt.app' }); // Missing httpOnly, secure, sameSite!
  `;
  const res12 = await scan(insecureCookieCode, 'auth.js', 'javascript');
  assert(res12.some(f => f.ruleId === 'JWT013'), 'Cookie JWT storage missing secure properties triggers JWT013');

  // Test Case 13: Expiration checks bypassed (ignoreExpiration: true)
  const ignoreExpCode = `
    jwt.verify(token, key, { ignoreExpiration: true });
  `;
  const res13 = await scan(ignoreExpCode, 'auth.js', 'javascript');
  assert(res13.some(f => f.ruleId === 'JWT015'), 'ignoreExpiration: true verification triggers JWT015');

  // Test Case 14: Long-lived Token configurations
  const longLivedCode = `
    const token = jwt.sign(payload, key, { expiresIn: '30d' });
  `;
  const res14 = await scan(longLivedCode, 'auth.js', 'javascript');
  assert(res14.some(f => f.ruleId === 'JWT006' && f.evidence.snippet.includes("expiresIn: '30d'")), 'expiresIn longer than 7 days triggers JWT006');

  // Test Case 15: Malformed token parsing (base64 candidate segments test)
  const candidateToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`;
  const res15 = await scan(candidateToken, 'tokens.json', 'config');
  assert(res15.some(f => f.evidence.tokenType === 'JWS'), 'Recognizes full JWS token candidates');

  // Test Case 16: JWE recognition (RSA1_5 / dir algorithm check)
  const jweTokenCode = `
    // JWE with RSA1_5 encryption header
    const token = "eyJhbGciOiJSU0ExXzUiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0.parts.parts.parts.parts";
  `;
  const res16 = await scan(jweTokenCode, 'auth.js', 'javascript');
  assert(res16.some(f => f.ruleId === 'JWT017'), 'Insecure JWE RSA1_5 headers trigger JWT017');

  // Test Case 17: Import and library fingerprinting (PyJWT / Python)
  const pyCode = `
    import jwt
    jwt_secret = "weak_secret"
    payload = {"sub": "user_id"}
    token = jwt.encode(payload, "secret", algorithm="HS256")
  `;
  const res17 = await scan(pyCode, 'auth.py', 'python');
  assert(res17.some(f => f.evidence.library === 'PyJWT' && f.evidence.language === 'python'), 'PyJWT Py imports fingerprinted correctly');

  // Test Case 18: Import and library fingerprinting (golang-jwt / Go)
  const goCode = `
    import (
      "github.com/golang-jwt/jwt"
    )
    var jwtSecret = "weak_secret"
  `;
  const res18 = await scan(goCode, 'auth.go', 'go');
  assert(res18.some(f => f.evidence.library === 'golang-jwt' && f.evidence.language === 'go'), 'golang-jwt Go imports fingerprinted correctly');

  // Test Case 19: Cross-File Correlation
  // Setup: Secret configured in config.js (was run in Test Case 6)
  // Action: We sign a token in a different file verify.js. The orchestrator links verify.js token finding with the config.js secret definition.
  const verifyFileCode = `
    // verification file
    const verified = jwt.verify(token, key);
  `;
  const res19 = await scan(verifyFileCode, 'verify.js', 'javascript');
  const correlated = res19.find(f => f.evidence.api.includes('jwt.verify') || f.ruleId === 'JWT002');
  if (!correlated || correlated.evidence.confidence !== 98 || !(correlated.evidence as any).recommendation.includes('Correlated with secret defined in config.js:')) {
    console.log('DEBUG res19 findings:', JSON.stringify(res19, null, 2));
    console.log('DEBUG globalSecrets:', Array.from(JwtDetector.globalSecrets.entries()));
  }
  assert(correlated && correlated.evidence.confidence === 98 && (correlated.evidence as any).recommendation.includes('Correlated with secret defined in config.js:'), 'Cross-file secret correlation boosts confidence score to 98%');

  // Test Case 20: False Positive Comment Suppression
  const commentCode = `
    // const jwtSecret = "hardcoded_but_commented_out";
    # const token = "abc.def.ghi";
  `;
  const res20 = await scan(commentCode, 'auth.js', 'javascript');
  assert(res20.length === 0, 'Comment lines are ignored (false positive suppression)');

  // Test Case 21: Capabilities Metadata and AST Interface Verification
  assert(detector.capabilities.supportsAST === false, 'Capability metadata supportsAST is false');
  assert(detector.capabilities.supportsCrossFileCorrelation === true, 'Capability metadata supportsCrossFileCorrelation is true');

  // --- SUMMARY ---
  console.log(`\n=== JWT Security Analyzer Test Summary ===`);
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
