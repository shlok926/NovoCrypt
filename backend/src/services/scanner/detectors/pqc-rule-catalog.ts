import { Rule } from '../types';

export const pqcRules: Record<string, Rule> = {
  PQC001: {
    id: 'PQC001',
    title: 'Quantum-Vulnerable RSA',
    description: 'RSA key transport, exchange, or signature validation is vulnerable to Shor\'s algorithm on future CRQCs.',
    severity: 'high',
    currentRisk: 'RSA parameters can be decrypted/forged retrospectively if encrypted communications are recorded today.',
    quantumRisk: 'Total compromise of cipher confidentiality and signatures via integer factorization.',
    recommendation: 'Configure hybrid key exchanges (e.g. X25519 + ML-KEM) and map signature upgrade pathways.',
    references: ['NIST SP 1800-38', 'NIST SP 800-57']
  },
  PQC002: {
    id: 'PQC002',
    title: 'Quantum-Vulnerable ECDH',
    description: 'Elliptic Curve Diffie-Hellman (ECDH) key exchanges are vulnerable to Shor\'s algorithm on CRQCs.',
    severity: 'high',
    currentRisk: 'Key agreements can be decrypted retrospectively, leaking session keys.',
    quantumRisk: 'Shor\'s algorithm computes discrete logarithms on elliptic curves in polynomial time.',
    recommendation: 'Transition to hybrid post-quantum key encapsulation mechanisms (ML-KEM).',
    references: ['NIST SP 1800-38', 'RFC 9370']
  },
  PQC003: {
    id: 'PQC003',
    title: 'Classical Cryptographic Signatures',
    description: 'Classical signature algorithms (ECDSA, DSA) lack quantum-resistant protection.',
    severity: 'medium',
    currentRisk: 'Signatures can be forged retrospectively, rendering identity assertions invalid.',
    quantumRisk: 'Shor\'s algorithm forgery risk.',
    recommendation: 'Schedule signature transitions to ML-DSA or SLH-DSA.',
    references: ['FIPS 204', 'FIPS 205']
  },
  PQC004: {
    id: 'PQC004',
    title: 'Missing PQC Planning',
    description: 'Target codebase does not manifest cryptographic inventory tracking, hindering quantum-safe transition.',
    severity: 'medium',
    currentRisk: 'Lack of transition plans leads to uncoordinated deprecation and compliance gaps.',
    quantumRisk: 'Inability to respond to sudden quantum advancements.',
    recommendation: 'Formulate a cryptographic inventory and catalog all asymmetric endpoints.',
    references: ['NIST IR 8547', 'CNSA 2.0']
  },
  PQC005: {
    id: 'PQC005',
    title: 'Deprecated Classical Cryptography',
    description: 'Legacy algorithms (DES, SHA-1, MD5) are used alongside quantum-vulnerable cryptography.',
    severity: 'high',
    currentRisk: 'Vulnerable to immediate classical cryptanalysis today.',
    quantumRisk: 'Immediate classical compromise compound quantum migration risks.',
    recommendation: 'Migrate deprecated algorithms to secure classical standards (AES-256) first.',
    references: ['NIST SP 800-131A', 'OWASP Cheat Sheet']
  },
  PQC006: {
    id: 'PQC006',
    title: 'Missing Hybrid Deployment',
    description: 'Active network configurations do not define hybrid key exchange options.',
    severity: 'medium',
    currentRisk: 'Fails to protect communications in transit against store-now-decrypt-later attacks.',
    quantumRisk: 'Retroactive decrypt of TLS sessions.',
    recommendation: 'Enable hybrid negotiation (e.g., X25519_MLKEM768) in TLS/network settings.',
    references: ['RFC 9370', 'ETSI PQC Migration Guidance']
  },
  PQC007: {
    id: 'PQC007',
    title: 'Unsupported Crypto Library',
    description: 'Legacy cryptography libraries are utilized which lack future PQC integration pathways.',
    severity: 'medium',
    currentRisk: 'Requires code refactoring or rewrite when upgrading to post-quantum algorithms.',
    quantumRisk: 'Inability to swap algorithms dynamically.',
    recommendation: 'Transition to modular cryptographic libraries (e.g., OpenSSL v3.x, Bouncy Castle v1.78+).',
    references: ['NIST SP 1800-38', 'CNSA 2.0']
  },
  PQC008: {
    id: 'PQC008',
    title: 'Legacy Certificate',
    description: 'X.509 certificates utilize classical asymmetric parameters exclusively.',
    severity: 'medium',
    currentRisk: 'Identity and domain validation checks are vulnerable to retrospective spoofing.',
    quantumRisk: 'Certificate forging and server impersonation.',
    recommendation: 'Provision hybrid double-signed certificates or test ML-DSA certificates in staging.',
    references: ['RFC 9370', 'ETSI PQC Migration Guidance']
  },
  PQC009: {
    id: 'PQC009',
    title: 'Missing Crypto Inventory',
    description: 'The project lacks metadata structures mapping algorithm usage.',
    severity: 'info',
    currentRisk: 'Increases complexity in identifying hardcoded dependencies and keys.',
    quantumRisk: 'Hidden vulnerable dependencies remain unpatched.',
    recommendation: 'Build an automated software bill of materials (SBOM) representing all cryptographic symbols.',
    references: ['NIST IR 8547', 'CNSA 2.0']
  },
  PQC010: {
    id: 'PQC010',
    title: 'Weak Migration Readiness Score',
    description: 'Calculated post-quantum migration readiness score falls below the required threshold of 50.',
    severity: 'medium',
    currentRisk: 'High concentration of static, hardcoded, or deprecated cryptographic patterns.',
    quantumRisk: 'Critical transition blockages.',
    recommendation: 'Remove hardcoded parameters, enforce cryptographic agility, and deprecate legacy APIs.',
    references: ['NIST IR 8547', 'NIST SP 1800-38']
  },
  PQC011: {
    id: 'PQC011',
    title: 'No Algorithm Agility',
    description: 'The cryptographic configuration uses hardcoded, non-configurable algorithm selections.',
    severity: 'medium',
    currentRisk: 'Swapping algorithms requires compiling code changes rather than config changes.',
    quantumRisk: 'Complete architectural lockdown.',
    recommendation: 'Decouple algorithm selections into runtime configuration profiles or agile variables.',
    references: ['NIST IR 8547', 'ETSI PQC Migration Guidance']
  },
  PQC012: {
    id: 'PQC012',
    title: 'Hardcoded Classical Key',
    description: 'Symmetric/asymmetric classical keys are hardcoded in source configurations.',
    severity: 'high',
    currentRisk: 'Key compromise via source leakage or configuration scraping.',
    quantumRisk: 'Compromised keys expose historic ciphertexts to decryption.',
    recommendation: 'Retrieve keys dynamically from environment or Key Management Services (KMS).',
    references: ['OWASP ASVS', 'OWASP Cryptographic Storage Cheat Sheet']
  },
  PQC013: {
    id: 'PQC013',
    title: 'Hybrid Deployment Detected',
    description: 'Scanned files manifest active hybrid deployments.',
    severity: 'info',
    currentRisk: 'None. Represents modern secure migration state.',
    quantumRisk: 'Protects key encapsulation parameters against quantum interception.',
    recommendation: 'Monitor hybrid performance parameters and transition pilots to production.',
    references: ['RFC 9370', 'ETSI PQC Migration Guidance']
  },
  PQC014: {
    id: 'PQC014',
    title: 'ML-KEM (Kyber) Detected',
    description: 'Identifies the presence of NIST-standardized ML-KEM key encapsulation mechanism parameters.',
    severity: 'info',
    currentRisk: 'None. Safe operation.',
    quantumRisk: 'Secure against quantum cryptanalysis.',
    recommendation: 'Verify standard ML-KEM level settings (512, 768, 1024).',
    references: ['FIPS 203']
  },
  PQC015: {
    id: 'PQC015',
    title: 'ML-DSA (Dilithium) Detected',
    description: 'Identifies the presence of NIST-standardized ML-DSA digital signature parameters.',
    severity: 'info',
    currentRisk: 'None. Safe operation.',
    quantumRisk: 'Secure signature validation.',
    recommendation: 'Verify signature parameters configurations (44, 65, 87).',
    references: ['FIPS 204']
  },
  PQC016: {
    id: 'PQC016',
    title: 'SLH-DSA (SPHINCS+) Detected',
    description: 'Identifies the presence of stateless hash-based SLH-DSA parameters.',
    severity: 'info',
    currentRisk: 'None. Safe operation.',
    quantumRisk: 'Secure stateless signature checks.',
    recommendation: 'Verify configuration sizes and assess network payload sizes.',
    references: ['FIPS 205']
  },
  PQCB001: {
    id: 'PQCB001',
    title: 'Post-Quantum Best Practices',
    description: 'Cryptographic settings comply with quantum-resistant guidelines.',
    severity: 'info',
    currentRisk: 'None.',
    quantumRisk: 'None.',
    recommendation: 'Monitor NIST PQC standardization developments.',
    references: ['FIPS 203', 'FIPS 204', 'FIPS 205']
  }
};
