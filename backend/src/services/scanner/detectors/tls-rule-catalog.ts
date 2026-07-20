import { Rule } from '../types';

export const tlsRules: Record<string, Rule> = {
  TLS001: {
    id: 'TLS001',
    title: 'Expired Certificate',
    description: 'The certificate validity period has ended. Clients will reject this certificate, leading to connection failures.',
    severity: 'critical',
    currentRisk: 'Vulnerable to complete denial of service and client trust failure.',
    quantumRisk: 'Unaffected by quantum timeline, but breaks immediate communication security.',
    recommendation: 'Renew the certificate immediately with a valid certificate from a trusted CA.',
    references: ['RFC 5280 Section 4.1.2.5']
  },
  TLS002: {
    id: 'TLS002',
    title: 'Weak Signature Algorithm',
    description: 'The certificate was signed using a weak or deprecated signature algorithm (e.g., MD5, SHA-1).',
    severity: 'critical',
    currentRisk: 'Vulnerable to collision attacks allowing attackers to forge certificates.',
    quantumRisk: 'Grover\'s algorithm further degrades hash security, but SHA-1/MD5 are already classically broken.',
    recommendation: 'Reissue the certificate using SHA-256 or SHA-384 signature algorithms.',
    references: ['RFC 6151', 'NIST SP 800-131A']
  },
  TLS003: {
    id: 'TLS003',
    title: 'Weak Key Size',
    description: 'The certificate public key size is too small (RSA < 2048 bits or ECC < 256 bits).',
    severity: 'critical',
    currentRisk: 'RSA keys smaller than 2048 bits are vulnerable to classical factoring attacks. RSA-2048 keys are classically secure but deprecated.',
    quantumRisk: 'Shor\'s algorithm will completely factor RSA keys and solve ECC discrete logarithms on a cryptographically relevant quantum computer (CRQC).',
    recommendation: 'Upgrade to RSA-3072, RSA-4096 or ECDSA (secp256r1 or higher). Implement hybrid post-quantum algorithms (ML-KEM/ML-DSA) where possible.',
    references: ['NIST SP 800-57', 'FIPS 204']
  },
  TLS004: {
    id: 'TLS004',
    title: 'Missing Subject Alternative Name (SAN)',
    description: 'The certificate does not contain the Subject Alternative Name extension. Modern web browsers require SAN and deprecate Common Name (CN) matching.',
    severity: 'high',
    currentRisk: 'Browsers will reject the certificate, raising security warnings for users.',
    quantumRisk: 'None.',
    recommendation: 'Reissue the certificate with appropriate SAN extension containing the target hostname.',
    references: ['RFC 6125', 'CAB Forum Baseline Requirements Section 7.1.4.2.1']
  },
  TLS005: {
    id: 'TLS005',
    title: 'Hostname Mismatch',
    description: 'The target hostname does not match the Common Name (CN) or any Subject Alternative Names (SAN) in the certificate.',
    severity: 'high',
    currentRisk: 'Allows Man-in-the-Middle (MitM) attacks because clients cannot verify the server identity.',
    quantumRisk: 'None.',
    recommendation: 'Ensure the certificate is issued to match the exact hostname, or access the service using a matching hostname.',
    references: ['RFC 6125']
  },
  TLS006: {
    id: 'TLS006',
    title: 'Self-Signed Certificate',
    description: 'The certificate is self-signed and not signed by a recognized Certificate Authority (CA).',
    severity: 'high',
    currentRisk: 'Clients cannot establish trust, making the connection highly susceptible to active Man-in-the-Middle (MitM) attacks.',
    quantumRisk: 'None.',
    recommendation: 'Replace with a certificate signed by a trusted internal CA or a public Certificate Authority (e.g., Let\'s Encrypt).',
    references: ['RFC 5280']
  },
  TLS007: {
    id: 'TLS007',
    title: 'Certificate Not Yet Valid',
    description: 'The certificate validity start date (Not Before) is in the future. Clients will reject it.',
    severity: 'high',
    currentRisk: 'Clients will reject the connection due to validity period issues.',
    quantumRisk: 'None.',
    recommendation: 'Check the system clock synchronization on the client and server. Reissue if the start date is set incorrectly.',
    references: ['RFC 5280 Section 4.1.2.5']
  },
  TLS008: {
    id: 'TLS008',
    title: 'Certificate Expiring Soon',
    description: 'The certificate is expiring in less than 30 days.',
    severity: 'medium',
    currentRisk: 'Failure to renew in time will cause connection outages.',
    quantumRisk: 'None.',
    recommendation: 'Schedule certificate renewal before the validity period expires.',
    references: ['NIST SP 800-57']
  },
  TLS009: {
    id: 'TLS009',
    title: 'Missing OCSP Endpoint',
    description: 'The certificate does not contain Authority Information Access (AIA) extension for Online Certificate Status Protocol (OCSP).',
    severity: 'low',
    currentRisk: 'Clients cannot perform real-time revocation status checks, forcing fallback or CRL parsing.',
    quantumRisk: 'None.',
    recommendation: 'Configure the CA to include OCSP responder URIs in the AIA extension.',
    references: ['RFC 5280 Section 4.2.2.1']
  },
  TLS010: {
    id: 'TLS010',
    title: 'Missing CRL Distribution Point',
    description: 'The certificate does not contain the CRL Distribution Points extension.',
    severity: 'low',
    currentRisk: 'Clients cannot check revocation status via Certificate Revocation Lists (CRL) if OCSP fails.',
    quantumRisk: 'None.',
    recommendation: 'Configure the CA to include CRL distribution points in the certificate extensions.',
    references: ['RFC 5280 Section 4.2.1.13']
  },
  TLS011: {
    id: 'TLS011',
    title: 'Deprecated TLS/SSL Protocol Enabled',
    description: 'The server supports deprecated or insecure SSL/TLS protocols (SSLv2, SSLv3, TLS 1.0, or TLS 1.1).',
    severity: 'critical',
    currentRisk: 'Vulnerable to protocol downgrade attacks and cryptographic weaknesses (e.g., POODLE, BEAST).',
    quantumRisk: 'Quantum attacks exacerbate vulnerabilities, but protocols are already broken classically.',
    recommendation: 'Disable SSLv2, SSLv3, TLS 1.0, and TLS 1.1 on the server. Mandate TLS 1.2 and TLS 1.3.',
    references: ['RFC 8996', 'NIST SP 800-52 Rev. 2']
  },
  TLS012: {
    id: 'TLS012',
    title: 'Weak Cipher Suite Enabled',
    description: 'The server supports insecure or weak cipher suites (e.g., RC4, 3DES, NULL, EXPORT, Anonymous, CBC-only suites without AEAD, or non-Forward Secrecy key exchanges).',
    severity: 'high',
    currentRisk: 'Vulnerable to passive decryption, session hijacking, or collision attacks (e.g., Sweet32).',
    quantumRisk: 'Quantum computers will render non-Forward Secrecy handshakes decryptable retroactively. Symmetric key strength is halved.',
    recommendation: 'Disable weak ciphers. Restrict server configuration to modern AEAD ciphers (AES-GCM, ChaCha20-Poly1305) with Forward Secrecy (ECDHE/DHE).',
    references: ['RFC 7540', 'NIST SP 800-52 Rev. 2']
  },
  TLS013: {
    id: 'TLS013',
    title: 'Broken Certificate Chain',
    description: 'The certificate chain has structural issues (e.g., missing intermediate certificates, invalid signatures between certificates, duplicate intermediates, incorrect ordering, or unknown/untrusted root).',
    severity: 'high',
    currentRisk: 'Clients cannot construct a valid chain of trust to a trusted root anchor, resulting in connection rejection.',
    quantumRisk: 'None.',
    recommendation: 'Verify the certificate installation. Order certificates as Leaf -> Intermediates. Ensure all intermediate certificates are sent by the server.',
    references: ['RFC 5280 Section 6']
  },
  TLS014: {
    id: 'TLS014',
    title: 'Incorrect Key Usage Extensions',
    description: 'The certificate lacks correct Key Usage, Extended Key Usage, or Basic Constraints extensions (e.g., CA flag is true for a leaf certificate, or serverAuth is missing for server TLS certs).',
    severity: 'high',
    currentRisk: 'Clients will reject the certificate if its usage violates constraints (e.g. signing certificates used as CA certificates without the CA flag).',
    quantumRisk: 'None.',
    recommendation: 'Reissue the certificate with appropriate Key Usage (digitalSignature, keyEncipherment) and Extended Key Usage (serverAuth) extensions.',
    references: ['RFC 5280 Section 4.2.1.3', 'RFC 5280 Section 4.2.1.12']
  }
};
