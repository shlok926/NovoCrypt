import { PqcDetector } from '../src/services/scanner/detectors/pqc-detector';
import { ScanContext } from '../src/services/scanner/types';

console.log('🧪 Starting PQC Security Analyzer Regression Test Suite...\n');

async function runTests() {
  const detector = new PqcDetector();
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

  // Test Case 1: Classical Quantum-Vulnerable RSA
  const rsaCode = `
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res1 = await scan(rsaCode, 'encrypt.js', 'javascript');
  assert(res1.some(f => f.ruleId === 'PQC001'), 'Quantum-vulnerable RSA triggers PQC001');

  // Test Case 2: Classical Quantum-Vulnerable ECDH
  const ecdhCode = `
    const ecdh = crypto.createECDH('secp256r1');
  `;
  const res2 = await scan(ecdhCode, 'encrypt.js', 'javascript');
  assert(res2.some(f => f.ruleId === 'PQC002'), 'Classical ECDH triggers PQC002');

  // Test Case 3: Classical Cryptographic Signatures
  const ecdsaCode = `
    const sign = crypto.createSign('SHA256');
    sign.update('data');
    const signature = sign.sign(privateKey);
  `;
  const res3 = await scan(ecdsaCode, 'sign.js', 'javascript');
  assert(res3.some(f => f.ruleId === 'PQC003'), 'Classical signatures trigger PQC003');

  // Test Case 4: Deprecated Classical Cryptography (MD5)
  const deprecatedCode = `
    const hash = crypto.createHash('md5');
  `;
  const res4 = await scan(deprecatedCode, 'hash.js', 'javascript');
  assert(res4.some(f => f.ruleId === 'PQC005'), 'MD5 alongside classical crypto triggers PQC005');

  // Test Case 5: Hardcoded Classical Key
  const hardcodedCode = `
    const key = "rsa_private_key_constants_literal";
  `;
  const res5 = await scan(hardcodedCode, 'config.js', 'javascript');
  assert(res5.some(f => f.ruleId === 'PQC012'), 'Hardcoded classical key triggers PQC012');

  // Test Case 6: Standardized ML-KEM Detected
  const mlkemCode = `
    const kem = ML_KEM_768.generateKeyPair();
  `;
  const res6 = await scan(mlkemCode, 'encrypt.js', 'javascript');
  assert(res6.some(f => f.ruleId === 'PQC014'), 'ML-KEM triggers PQC014');

  // Test Case 7: Standardized ML-DSA Detected
  const mldsaCode = `
    const sig = ML_DSA_65.sign(message);
  `;
  const res7 = await scan(mldsaCode, 'sign.js', 'javascript');
  assert(res7.some(f => f.ruleId === 'PQC015'), 'ML-DSA triggers PQC015');

  // Test Case 8: Standardized SLH-DSA Detected
  const slhdsaCode = `
    const slhSig = SPHINCS_plus.sign(message);
  `;
  const res8 = await scan(slhdsaCode, 'sign.js', 'javascript');
  assert(res8.some(f => f.ruleId === 'PQC016'), 'SLH-DSA triggers PQC016');

  // Test Case 9: Hybrid KEM Detected
  const hybridCode = `
    const cipher = x25519_mlkem768_handshake();
  `;
  const res9 = await scan(hybridCode, 'network.js', 'javascript');
  assert(res9.some(f => f.ruleId === 'PQC013' && f.evidence.hybridStatus === 'Production-Ready'), 'Hybrid deployment triggers PQC013');

  // Test Case 10: Fully Crypto Agile Pattern
  const agileCode = `
    const factory = CryptographicFactory.getInstance();
  `;
  const res10 = await scan(agileCode, 'agile.js', 'javascript');
  assert(res10.some(f => (f.evidence as any).cryptoAgilityClassification === 'Fully Crypto Agile'), 'Dynamic factories trigger Fully Crypto Agile');

  // Test Case 11: Semi-Agile Pattern
  const semiAgileCode = `
    const alg = process.env.CRYPTO_ALG;
  `;
  const res11 = await scan(semiAgileCode, 'agile.js', 'javascript');
  assert(res11.some(f => (f.evidence as any).cryptoAgilityClassification === 'Semi-Agile'), 'Environment algorithm triggers Semi-Agile');

  // Test Case 12: Static Crypto Pattern
  const staticAgileCode = `
    Cipher.getInstance("AES");
  `;
  const res12 = await scan(staticAgileCode, 'static.java', 'java');
  assert(res12.some(f => (f.evidence as any).cryptoAgilityClassification === 'Static Crypto'), 'Hardcoded block sizes trigger Static Crypto');

  // Test Case 13: Classical Certificate signatureAlgorithm
  const rsaCertCode = `
    const signatureAlgorithm = "sha256WithRSAEncryption";
  `;
  const res13 = await scan(rsaCertCode, 'cert.js', 'javascript');
  assert(res13.some(f => f.ruleId === 'PQC008'), 'Classical cert algorithms trigger PQC008');

  // Test Case 14: Protocol Audit - TLS 1.3
  const tlsProtoCode = `
    const minVersion = "TLSv1.3";
  `;
  const res14 = await scan(tlsProtoCode, 'tls.js', 'javascript');
  assert(res14.some(f => (f.evidence as any).protocol === 'TLS'), 'TLSv1.3 parameter triggers TLS protocol match');

  // Test Case 15: Protocol Audit - SSH
  const sshProtoCode = `
    const keyType = "ssh-rsa";
  `;
  const res15 = await scan(sshProtoCode, 'ssh.js', 'javascript');
  assert(res15.some(f => (f.evidence as any).protocol === 'SSH'), 'ssh-rsa key parameter triggers SSH protocol match');

  // Test Case 16: Protocol Audit - VPN
  const vpnProtoCode = `
    const gateway = "wireguard";
  `;
  const res16 = await scan(vpnProtoCode, 'vpn.js', 'javascript');
  assert(res16.some(f => (f.evidence as any).protocol === 'VPN'), 'WireGuard keyword triggers VPN protocol match');

  // Test Case 17: Protocol Audit - CMS
  const cmsProtoCode = `
    const message = decode_cms();
  `;
  const res17 = await scan(cmsProtoCode, 'cms.js', 'javascript');
  assert(res17.some(f => (f.evidence as any).protocol === 'CMS/S-MIME'), 'CMS keyword triggers CMS/S-MIME protocol match');

  // Test Case 18: Protocol Audit - PKCS11
  const pkcsProtoCode = `
    import "pkcs11";
  `;
  const res18 = await scan(pkcsProtoCode, 'hsm.js', 'javascript');
  assert(res18.some(f => (f.evidence as any).protocol === 'PKCS#11'), 'PKCS11 keyword triggers PKCS#11 protocol match');

  // Test Case 19: Context-Aware Severity (Document Signing vs Active TLS)
  // Action: Scans a line containing "documentSign" with RSA
  const docSignCode = `
    const signature = documentSign(privateKey);
  `;
  const res19 = await scan(docSignCode, 'sign.js', 'javascript');
  const docFinding = res19.find(f => f.ruleId === 'PQC003');
  assert(docFinding && docFinding.severity === 'medium', 'Document signing context assigns Medium severity');

  // Test Case 20: Vendor Guidance Profile (AWS KMS)
  const awsCode = `
    const kms = new AWS.KMS();
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const md5Hash = crypto.createHash('md5');
    const secret = "rsa_private_key_constants_literal";
    Cipher.getInstance("AES/CBC/ZeroPadding");
    const signatureAlgorithm = "sha256WithRSAEncryption";
  `;
  const res20 = await scan(awsCode, 'kms.js', 'javascript');
  const awsFinding = res20.find(f => f.ruleId === 'PQC010');
  assert(awsFinding && (awsFinding.evidence as any).recommendation.includes('[Vendor Guidance - AWS KMS]:'), 'AWS KMS context includes AWS-specific migration recommendations');

  // Test Case 21: Vendor Guidance Profile (Azure Key Vault)
  const azureCode = `
    const vault = new SecretClient(azureUrl);
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const md5Hash = crypto.createHash('md5');
    const secret = "rsa_private_key_constants_literal";
    Cipher.getInstance("AES/CBC/ZeroPadding");
    const signatureAlgorithm = "sha256WithRSAEncryption";
  `;
  const res21 = await scan(azureCode, 'vault.js', 'javascript');
  const azureFinding = res21.find(f => f.ruleId === 'PQC010');
  assert(azureFinding && (azureFinding.evidence as any).recommendation.includes('[Vendor Guidance - Azure Key Vault]:'), 'Azure Key Vault context includes Azure-specific recommendations');

  // Test Case 22: Vendor Guidance Profile (Google Cloud KMS)
  const gcpCode = `
    const client = new gcp.KeyManagementServiceClient();
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const md5Hash = crypto.createHash('md5');
    const secret = "rsa_private_key_constants_literal";
    Cipher.getInstance("AES/CBC/ZeroPadding");
    const signatureAlgorithm = "sha256WithRSAEncryption";
  `;
  const res22 = await scan(gcpCode, 'gcp.js', 'javascript');
  const gcpFinding = res22.find(f => f.ruleId === 'PQC010');
  assert(gcpFinding && (gcpFinding.evidence as any).recommendation.includes('[Vendor Guidance - Google Cloud KMS]:'), 'Google Cloud KMS context includes Google-specific recommendations');

  // Test Case 23: Vendor Guidance Profile (HashiCorp Vault)
  const vaultCode = `
    const vault = require('node-vault')();
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const md5Hash = crypto.createHash('md5');
    const secret = "rsa_private_key_constants_literal";
    Cipher.getInstance("AES/CBC/ZeroPadding");
    const signatureAlgorithm = "sha256WithRSAEncryption";
  `;
  const res23 = await scan(vaultCode, 'vault.js', 'javascript');
  const vaultFinding = res23.find(f => f.ruleId === 'PQC010');
  assert(vaultFinding && (vaultFinding.evidence as any).recommendation.includes('[Vendor Guidance - HashiCorp Vault]:'), 'HashiCorp Vault context includes HashiCorp-specific recommendations');

  // Test Case 24: Cryptographic SBOM Inventory check
  const inventoryCode = `
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const md5Hash = crypto.createHash('md5');
    const secret = "rsa_private_key_constants_literal";
    Cipher.getInstance("AES/CBC/ZeroPadding");
    const signatureAlgorithm = "sha256WithRSAEncryption";
  `;
  const res24 = await scan(inventoryCode, 'encrypt.js', 'javascript');
  const invFinding = res24.find(f => f.ruleId === 'PQC010');
  assert(
    invFinding && 
    (invFinding.evidence as any).inventoryIdentifier !== 'unknown' &&
    (invFinding.evidence as any).inventoryReferences.length > 0 &&
    (invFinding.evidence as any).migrationRoadmapReferences.length > 0,
    'SBOM Inventory references and migration roadmap phases are populated'
  );

  // Test Case 25: Library Fingerprint (liboqs C/CPP)
  const oqsCode = `
    #include <oqs/oqs.h>
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res25 = await scan(oqsCode, 'oqs.cpp', 'cpp');
  assert(res25.some(f => f.evidence.library === 'liboqs'), 'Fingerprints liboqs correctly');

  // Test Case 26: Library Fingerprint (Bouncy Castle Java)
  const bcCode = `
    import org.bouncycastle.pqc.crypto.crystals.kyber.KyberParameters;
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res26 = await scan(bcCode, 'Crypto.java', 'java');
  assert(res26.some(f => f.evidence.library === 'Bouncy Castle'), 'Fingerprints Bouncy Castle correctly');

  // Test Case 27: Library Fingerprint (AWS-LC C/CPP)
  const awslcCode = `
    #include <openssl/evp.h> // aws-lc parameters
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res27 = await scan(awslcCode, 'aws-lc.c', 'c');
  assert(res27.some(f => f.evidence.library === 'AWS-LC'), 'Fingerprints AWS-LC correctly');

  // Test Case 28: Library Fingerprint (CIRCL Go)
  const circlCode = `
    import "github.com/cloudflare/circl/kem/kyber"
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res28 = await scan(circlCode, 'encrypt.go', 'go');
  assert(res28.some(f => f.evidence.library === 'CIRCL'), 'Fingerprints Cloudflare CIRCL correctly');

  // Test Case 29: Library Fingerprint (PQClean C/CPP)
  const pqcleanCode = `
    #include "pqclean.h"
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res29 = await scan(pqcleanCode, 'pqclean.c', 'c');
  assert(res29.some(f => f.evidence.library === 'PQClean'), 'Fingerprints PQClean correctly');

  // Test Case 30: Library Fingerprint (pqcrypto Python/Rust)
  const pqcryptoCode = `
    import pqcrypto
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res30 = await scan(pqcryptoCode, 'encrypt.py', 'python');
  assert(res30.some(f => f.evidence.library === 'pqcrypto'), 'Fingerprints pqcrypto correctly');

  // Test Case 31: Library Fingerprint (RustCrypto Rust)
  const rustcryptoCode = `
    use rustcrypto_kem;
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res31 = await scan(rustcryptoCode, 'encrypt.rs', 'rust');
  assert(res31.some(f => f.evidence.library === 'RustCrypto'), 'Fingerprints RustCrypto correctly');

  // Test Case 32: Library Fingerprint (Go x/crypto Go)
  const goxCode = `
    import "golang.org/x/crypto/ssh"
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res32 = await scan(goxCode, 'encrypt.go', 'go');
  assert(res32.some(f => f.evidence.library === 'Go x/crypto'), 'Fingerprints Go x/crypto correctly');

  // Test Case 33: Library Fingerprint (Botan C/CPP)
  const botanCode = `
    #include <botan/botan.h>
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res33 = await scan(botanCode, 'botan.cpp', 'cpp');
  assert(res33.some(f => f.evidence.library === 'Botan'), 'Fingerprints Botan correctly');

  // Test Case 34: Cross-File Correlation
  // Action: Scan cipher initialization in verify.js. It correlates the secret definition from config.js.
  const cipherInitCode = `
    const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
  `;
  const res34 = await scan(cipherInitCode, 'verify.js', 'javascript');
  const correlated = res34.find(f => f.ruleId === 'PQC001');
  assert(correlated && (correlated.evidence as any).recommendation.includes('config.js:'), 'Cross-file key correlation details are appended to findings');

  // Test Case 35: Comment line suppression (False Positive check)
  const commentedCode = `
    // const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
    # const ecdh = crypto.createECDH('secp256r1');
  `;
  const res35 = await scan(commentedCode, 'encrypt.js', 'javascript');
  assert(res35.length === 0, 'Comment lines are ignored (false positive suppression)');

  // Test Case 36: Capabilities Metadata check
  assert(detector.capabilities.supportsAST === true, 'PQC capabilities supportAST is true');
  assert(detector.capabilities.supportsCrossFileCorrelation === true, 'PQC capabilities supportCrossFileCorrelation is true');

  // --- SUMMARY ---
  console.log(`\n=== PQC Security Analyzer Test Summary ===`);
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
