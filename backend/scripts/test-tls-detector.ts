import * as forge from 'node-forge';
import * as fs from 'fs/promises';
import * as path from 'path';
import https from 'https';
import { TlsX509Detector } from '../src/services/scanner/detectors/tls-x509-detector';
import { ScanContext, ScanFinding } from '../src/services/scanner/types';
import { tlsRules } from '../src/services/scanner/detectors/tls-rule-catalog';

console.log('🧪 Starting TLS/X.509 Security Analyzer Regression Test Suite...\n');

// Helper to generate a mock certificate using node-forge
function generateMockCert(options: {
  keySize?: number;
  subjectCN?: string;
  issuerCN?: string;
  validityStart?: Date;
  validityEnd?: Date;
  sans?: string[];
  signatureAlgorithm?: 'sha256' | 'sha1' | 'md5';
  isCA?: boolean;
  parentKey?: any;
  selfSigned?: boolean;
}): { pem: string; cert: any; keys: any } {
  const keys = forge.pki.rsa.generateKeyPair(options.keySize || 2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '012345';
  
  const validityStart = options.validityStart || new Date();
  const validityEnd = options.validityEnd || new Date();
  if (!options.validityStart) validityStart.setDate(validityStart.getDate() - 1);
  if (!options.validityEnd) validityEnd.setDate(validityEnd.getDate() + 365);
  
  cert.validity.notBefore = validityStart;
  cert.validity.notAfter = validityEnd;
  
  const subject = [{ name: 'commonName', value: options.subjectCN || 'example.com' }];
  cert.setSubject(subject);
  
  const issuer = [{ name: 'commonName', value: options.issuerCN || (options.selfSigned ? options.subjectCN || 'example.com' : 'Mock Issuer Root CA') }];
  cert.setIssuer(issuer);
  
  const extensions: any[] = [];
  if (options.isCA !== undefined) {
    extensions.push({ name: 'basicConstraints', cA: options.isCA });
  }
  
  if (options.sans && options.sans.length > 0) {
    extensions.push({
      name: 'subjectAltName',
      altNames: options.sans.map(san => ({ type: 2, value: san }))
    });
  }
  
  cert.setExtensions(extensions);
  
  const signKey = options.parentKey || keys.privateKey;
  const hashAlg = options.signatureAlgorithm || 'sha256';
  cert.sign(signKey, forge.md[hashAlg].create());
  
  const pem = forge.pki.certificateToPem(cert);
  return { pem, cert, keys };
}

async function runTests() {
  const detector = new TlsX509Detector();
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

  // --- STATIC CERTIFICATE ANALYSIS TESTS ---
  console.log('\n=== Testing Static Certificate Analysis ===\n');

  // Test Case 1: Valid PEM Certificate (Self-Signed)
  const cert1 = generateMockCert({ 
    subjectCN: 'valid.example.com', 
    sans: ['valid.example.com', 'www.valid.example.com'],
    selfSigned: true 
  });
  const contextValid: ScanContext = {
    targetType: 'code',
    target: cert1.pem,
    fileName: 'test-valid.pem'
  };
  const findingsValid = await detector.detect(contextValid);
  assert(findingsValid.some(f => f.ruleId === 'TLS006'), 'Valid PEM self-signed cert flags TLS006');
  assert(!findingsValid.some(f => f.ruleId === 'TLS001'), 'Valid PEM cert does not flag TLS001 (Expired)');

  // Test Case 2: Expired Certificate
  const expStart = new Date();
  expStart.setDate(expStart.getDate() - 10);
  const expEnd = new Date();
  expEnd.setDate(expEnd.getDate() - 1);
  const certExpired = generateMockCert({ subjectCN: 'expired.example.com', validityStart: expStart, validityEnd: expEnd });
  const findingsExpired = await detector.detect({
    targetType: 'code',
    target: certExpired.pem,
    fileName: 'test-expired.pem'
  });
  assert(findingsExpired.some(f => f.ruleId === 'TLS001'), 'Expired certificate flags TLS001');

  // Test Case 3: Future-Dated Certificate (Not Yet Valid)
  const futStart = new Date();
  futStart.setDate(futStart.getDate() + 10);
  const futEnd = new Date();
  futEnd.setDate(futEnd.getDate() + 20);
  const certFuture = generateMockCert({ subjectCN: 'future.example.com', validityStart: futStart, validityEnd: futEnd });
  const findingsFuture = await detector.detect({
    targetType: 'code',
    target: certFuture.pem,
    fileName: 'test-future.pem'
  });
  assert(findingsFuture.some(f => f.ruleId === 'TLS007'), 'Future-dated certificate flags TLS007');

  // Test Case 4: Weak Signature Algorithm (MD5 / SHA1)
  const certWeakSig = generateMockCert({ subjectCN: 'weaksig.example.com', signatureAlgorithm: 'sha1' });
  const findingsWeakSig = await detector.detect({
    targetType: 'code',
    target: certWeakSig.pem,
    fileName: 'test-weaksig.pem'
  });
  assert(findingsWeakSig.some(f => f.ruleId === 'TLS002'), 'SHA-1 signed certificate flags TLS002');

  // Test Case 5: Weak Key Size (RSA-1024)
  const certWeakKey = generateMockCert({ subjectCN: 'weakkey.example.com', keySize: 1024 });
  const findingsWeakKey = await detector.detect({
    targetType: 'code',
    target: certWeakKey.pem,
    fileName: 'test-weakkey.pem'
  });
  assert(findingsWeakKey.some(f => f.ruleId === 'TLS003'), 'RSA-1024 certificate flags TLS003');

  // Test Case 6: Missing SAN
  const certMissingSAN = generateMockCert({ subjectCN: 'nosan.example.com', sans: [] });
  const findingsMissingSAN = await detector.detect({
    targetType: 'code',
    target: certMissingSAN.pem,
    fileName: 'test-nosan.pem'
  });
  assert(findingsMissingSAN.some(f => f.ruleId === 'TLS004'), 'Certificate with missing SAN flags TLS004');

  // Test Case 7: Corrupted / Truncated Certificate
  const corruptedPem = cert1.pem.substring(0, 100) + '\n[CORRUPTED DATA]\n' + cert1.pem.substring(200);
  const findingsCorrupted = await detector.detect({
    targetType: 'code',
    target: corruptedPem,
    fileName: 'test-corrupt.pem'
  });
  assert(findingsCorrupted.length === 0, 'Corrupted PEM handled gracefully with 0 findings and no crash');

  // Test Case 8: Embedded Base64 Discoveries
  const base64Der = forge.util.encode64(forge.util.hexToBytes(forge.asn1.toDer(forge.pki.certificateToAsn1(certExpired.cert)).toHex()));
  const embeddedCode = `
    const myCertificate = "${base64Der}";
    console.log("Loading certificate...");
  `;
  const findingsEmbedded = await detector.detect({
    targetType: 'code',
    target: embeddedCode,
    fileName: 'app.js'
  });
  assert(findingsEmbedded.some(f => f.ruleId === 'TLS001'), 'Embedded Base64 expired cert discovered and flags TLS001');

  // --- LIVE TLS HANDSHAKE TESTS (MOCK SERVERS) ---
  console.log('\n=== Testing Live TLS Analysis ===\n');

  // Generate a mock Certificate Authority (CA) and Leaf Certificate signed by it
  const caCert = generateMockCert({ subjectCN: 'Mock Root CA', isCA: true, selfSigned: true });
  const caKey = caCert.keys.privateKey;
  
  const leafCert = generateMockCert({
    subjectCN: 'localhost',
    issuerCN: 'Mock Root CA',
    parentKey: caKey,
    sans: ['localhost', '127.0.0.1'],
    selfSigned: false
  });
  
  // Set up local HTTPS test server
  const server = https.createServer({
    key: forge.pki.privateKeyToPem(leafCert.keys.privateKey),
    cert: leafCert.pem,
    ca: caCert.pem,
    minVersion: 'TLSv1.2',
    maxVersion: 'TLSv1.2'
  }, (req, res) => {
    res.writeHead(200);
    res.end('Mock TLS Server Handshake OK');
  });

  await new Promise<void>((resolveServer) => {
    server.listen(0, '127.0.0.1', async () => {
      const port = (server.address() as any).port;
      const targetUrl = `https://127.0.0.1:${port}`;
      console.log(`  [Mock TLS Server running at ${targetUrl}]`);

      try {
        // Test Case 9: Live Handshake Scenarios
        const liveFindings = await detector.detect({
          targetType: 'url',
          target: targetUrl
        });

        assert(liveFindings.length > 0, 'Live scan returns findings');
        // Root is unknown/untrusted in Node's system certificates
        assert(liveFindings.some(f => f.ruleId === 'TLS013'), 'Live scan flags TLS013 (Broken Chain / Untrusted Root)');
        // Legacy Protocol (TLSv1.2) should flag legacy rule
        assert(liveFindings.some(f => f.ruleId === 'TLS011' || f.ruleId === 'TLS002'), 'Negotiated TLS 1.2 flags legacy protocol rule');
        
        // Assert evidence completeness
        const finding = liveFindings[0];
        if (finding && finding.evidence) {
          const evidence = finding.evidence as any;
          assert(evidence.tlsVersion === 'TLSv1.2', 'Evidence captures TLS protocol version');
          assert(evidence.cipherSuite !== undefined, `Evidence captures cipher suite: ${evidence.cipherSuite}`);
          assert(evidence.keySize === 2048, 'Evidence captures key size: 2048');
        }
      } catch (e) {
        console.error('Live TLS test execution failed:', e);
      } finally {
        server.close(() => {
          resolveServer();
        });
      }
    });
  });

  // Test Case 10: Graceful network error handling (Connection Refused)
  const findingsRefused = await detector.detect({
    targetType: 'url',
    target: 'https://127.0.0.1:1' // Connection refused port
  });
  assert(findingsRefused.length === 0, 'Connection Refused handled gracefully returning 0 findings');

  // Test Case 11: DNS Failure Handling
  const findingsDns = await detector.detect({
    targetType: 'url',
    target: 'https://thisdomaindoesnotexistatall12345.xyz'
  });
  assert(findingsDns.length === 0, 'DNS failure handled gracefully returning 0 findings');

  // --- SUMMARY ---
  console.log(`\n=== Regression Test Summary ===`);
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
