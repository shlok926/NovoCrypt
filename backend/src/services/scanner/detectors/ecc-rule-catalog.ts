import { Rule } from '../types';

export const eccRules: Record<string, Rule> = {
  ECC001: {
    id: 'ECC001',
    title: 'Weak Elliptic Curve',
    description: 'The elliptic curve or key size selected is insecure (< 224 bits) and highly vulnerable to classical elliptic curve discrete logarithm (ECDLP) solving algorithms.',
    severity: 'critical',
    currentRisk: 'Vulnerable to complete private key recovery and traffic decryption classically.',
    quantumRisk: 'Shor\'s algorithm will trivialise any low-bit curve discrete logarithm immediately.',
    recommendation: 'Upgrade to a secure curve with at least 256 bits of key size (e.g., secp256r1 / NIST P-256, secp384r1 / NIST P-384, or Curve25519).',
    references: ['NIST SP 800-57 Part 1', 'FIPS 186-5']
  },
  ECC002: {
    id: 'ECC002',
    title: 'Deprecated Elliptic Curve',
    description: 'The selected elliptic curve is deprecated or not recommended for standard enterprise applications (e.g., secp256k1, NIST P-192, NIST P-224) due to low security margins or deprecation in standard PKI/TLS protocols.',
    severity: 'high',
    currentRisk: 'Incompatibility with standard security compliance frameworks, potentially lower cryptographic safety margins.',
    quantumRisk: 'Vulnerable to complete break by Shor\'s algorithm.',
    recommendation: 'Migrate to standard NIST curves (P-256, P-384, P-521) or modern curves like Curve25519 / Ed25519.',
    references: ['NIST SP 800-131A', 'RFC 8446 (TLS 1.3)']
  },
  ECC003: {
    id: 'ECC003',
    title: 'Insecure ECC API Usage',
    description: 'Identified insecure ECC cryptographic API configurations, such as custom curve structures, reuse of nonces, missing random padding, or weak default properties.',
    severity: 'high',
    currentRisk: 'Vulnerable to signature forgery, key leakage, or session hijacking through mathematical exploits (e.g. key extraction via static nonce reuse).',
    quantumRisk: 'Exacerbated by quantum-assisted cryptanalysis.',
    recommendation: 'Configure cryptographic libraries to use standard secure defaults, enable deterministic nonces (RFC 6979), and avoid implementing custom curve parameters.',
    references: ['RFC 6979', 'NIST SP 800-56A']
  },
  ECC004: {
    id: 'ECC004',
    title: 'Weak Signature Verification',
    description: 'The ECDSA/EdDSA signature verification is missing, bypassed, uses a broken hashing function (e.g. SHA-1 or MD5), or fails to inspect the verification boolean result.',
    severity: 'high',
    currentRisk: 'Allows bypass of authenticity controls, enabling authentication bypass or arbitrary code signing execution.',
    quantumRisk: 'None.',
    recommendation: 'Implement strict signature verification checking, verify the return boolean is checked, and mandate strong hash functions (SHA-256, SHA-512, or SHA-3).',
    references: ['FIPS 186-5']
  },
  ECC005: {
    id: 'ECC005',
    title: 'Weak Key Generation',
    description: 'ECC key generation is using predictable random number seeds, deprecated PRNG APIs, or unsafe library functions.',
    severity: 'high',
    currentRisk: 'Allows adversaries to predict private keys by reproducing key generation seeds.',
    quantumRisk: 'Vulnerable classically; quantum computers can solve keys even faster.',
    recommendation: 'Ensure key generation uses cryptographically secure pseudorandom number generators (CSPRNG) like crypto.randomBytes or native OS entropy.',
    references: ['NIST SP 800-90A']
  },
  ECCM001: {
    id: 'ECCM001',
    title: 'Quantum Migration Recommendation (ECC)',
    description: 'Classically secure modern elliptic curve cryptography (e.g., Curve25519, Ed25519, NIST P-256/384/521, Brainpool curves) is identified. These curves are robust against classical attacks, but are vulnerable to Shor\'s algorithm on a cryptographically relevant quantum computer (CRQC).',
    severity: 'info',
    currentRisk: 'Fully secure classically. Long-term risk of complete compromise in the post-quantum era.',
    quantumRisk: 'Complete compromise of keys, signatures, and encrypted handshakes via Shor\'s algorithm.',
    recommendation: 'Plan a transition migration roadmap to Post-Quantum Cryptography algorithms (ML-DSA / FIPS 204 for signatures, ML-KEM / FIPS 203 for key exchange/encapsulation). Implement hybrid cryptography (combining classical ECC with PQC) in transition interfaces.',
    references: ['NIST SP 800-208', 'FIPS 203 (ML-KEM)', 'FIPS 204 (ML-DSA)']
  }
};
