import { Rule } from '../types';

export const jwtRules: Record<string, Rule> = {
  JWT001: {
    id: 'JWT001',
    title: 'Unsecured JWT (alg=none)',
    description: 'The JSON Web Token is configured with "alg=none", which allows attackers to bypass signature verification checks entirely by modifying claims.',
    severity: 'critical',
    currentRisk: 'Allows complete authentication and authorization bypass.',
    quantumRisk: 'None.',
    recommendation: 'Reject tokens configured with "alg=none" on the verification server. Ensure the algorithm field is explicitly validated.',
    references: ['RFC 7515', 'OWASP JWT Cheat Sheet']
  },
  JWT002: {
    id: 'JWT002',
    title: 'HMAC vs Asymmetric Key Confusion (HS/RS Confusion)',
    description: 'The verification logic fails to restrict the accepted algorithm types, enabling an attacker to sign an asymmetric token (RS256) with the public key using a symmetric algorithm (HS256).',
    severity: 'high',
    currentRisk: 'Allows attackers to sign arbitrary claims using publicly available keys.',
    quantumRisk: 'None.',
    recommendation: 'Enforce specific algorithms in the verify/decode call parameters. Do not dynamically rely on the token header algorithm.',
    references: ['RFC 8725 Section 3.1']
  },
  JWT003: {
    id: 'JWT003',
    title: 'Missing Signature Verification',
    description: 'JWT payload is decoded or consumed without executing signature verification steps.',
    severity: 'high',
    currentRisk: 'Allows signature tampering, key forging, or spoofing identity values.',
    quantumRisk: 'None.',
    recommendation: 'Use the framework\'s verify() API instead of decode() to validate the cryptographic integrity of the token.',
    references: ['RFC 7519', 'OWASP ASVS v4.0.3']
  },
  JWT004: {
    id: 'JWT004',
    title: 'Weak HMAC Secret',
    description: 'The secret used to sign HS256/384/512 tokens is short, weak, or has low entropy, making it vulnerable to brute force and dictionary attacks.',
    severity: 'high',
    currentRisk: 'Enables private key recovery and arbitrary token forgery.',
    quantumRisk: 'None.',
    recommendation: 'Use a cryptographically secure key of at least 256 bits (32 bytes) for HMAC-SHA256.',
    references: ['NIST SP 800-117']
  },
  JWT005: {
    id: 'JWT005',
    title: 'Hardcoded Secret',
    description: 'Cryptographic secrets are hardcoded in the source code or configurations instead of being fetched from environmental variables or secure key vaults.',
    severity: 'high',
    currentRisk: 'Secrets can be leaked in source control repositories, leading to cluster-wide authentication bypass.',
    quantumRisk: 'None.',
    recommendation: 'Externalize JWT credentials using environmental variables, Vault, or KMS stores.',
    references: ['OWASP Top 10 A02:2021-Cryptographic Failures']
  },
  JWT006: {
    id: 'JWT006',
    title: 'Missing Expiration Claim (exp)',
    description: 'The JWT payload does not contain an "exp" (expiration) claim, meaning the token never expires.',
    severity: 'medium',
    currentRisk: 'Increases the window of opportunity for replaying stolen tokens indefinitely.',
    quantumRisk: 'None.',
    recommendation: 'Always set a reasonable expiration claim ("exp") on all issued access and refresh tokens.',
    references: ['RFC 7519 Section 4.1.4']
  },
  JWT007: {
    id: 'JWT007',
    title: 'Missing Audience Claim (aud)',
    description: 'The token lacks an "aud" (audience) claim, allowing it to be reused across different microservices or applications that have different trust boundaries.',
    severity: 'medium',
    currentRisk: 'Token replay across different service interfaces.',
    quantumRisk: 'None.',
    recommendation: 'Ensure tokens declare a target audience and that verification servers validate this claim.',
    references: ['RFC 7519 Section 4.1.3']
  },
  JWT008: {
    id: 'JWT008',
    title: 'Missing Issuer Claim (iss)',
    description: 'The token lacks an "iss" (issuer) claim, making it difficult to verify who authorized the token.',
    severity: 'medium',
    currentRisk: 'Difficult to enforce trust domains, potentially leading to trust boundary exploitation.',
    quantumRisk: 'None.',
    recommendation: 'Populate the "iss" claim in issued tokens and validate it on verification.',
    references: ['RFC 7519 Section 4.1.1']
  },
  JWT009: {
    id: 'JWT009',
    title: 'Missing Key Identifier (kid)',
    description: 'The token lacks a "kid" (key identifier) header, which is necessary for identifying the correct key in multi-key JWKS setups.',
    severity: 'medium',
    currentRisk: 'Inefficient or missing key lookups, potentially causing default key fallbacks.',
    quantumRisk: 'None.',
    recommendation: 'Include a unique "kid" in token headers for dynamic JWKS environments.',
    references: ['RFC 7515 Section 4.1.4']
  },
  JWT010: {
    id: 'JWT010',
    title: 'Unsafe JWKS Configuration',
    description: 'The application retrieves JSON Web Key Sets (JWKS) over insecure endpoints, lacks source trust validation, or has missing refresh constraints.',
    severity: 'high',
    currentRisk: 'Adversaries could manipulate remote JWKS endpoints or spoof response structures to force signature acceptance.',
    quantumRisk: 'None.',
    recommendation: 'Enforce HTTPS for all remote JWKS requests and configure safe timeouts/caching parameters.',
    references: ['RFC 7517', 'RFC 8725 Section 3.10']
  },
  JWT011: {
    id: 'JWT011',
    title: 'Replay Protection Missing',
    description: 'The token does not incorporate replay prevention properties such as "jti" (JWT ID), "nonce", or "state".',
    severity: 'medium',
    currentRisk: 'Enables token reuse/replay attacks if an adversary intercepts active handshakes.',
    quantumRisk: 'None.',
    recommendation: 'Include a unique "jti" claim in the token payload and track consumed IDs on the authentication backend.',
    references: ['RFC 7519 Section 4.1.7']
  },
  JWT012: {
    id: 'JWT012',
    title: 'Token Stored in LocalStorage / SessionStorage',
    description: 'Sensitive access tokens are stored in window.localStorage or sessionStorage, making them highly vulnerable to theft via Cross-Site Scripting (XSS) attacks.',
    severity: 'medium',
    currentRisk: 'Total token extraction by malicious scripts running in the context of the user session.',
    quantumRisk: 'None.',
    recommendation: 'Store sensitive tokens in secure, HttpOnly, SameSite cookies or memory structures.',
    references: ['OWASP HTML5 Security Cheat Sheet']
  },
  JWT013: {
    id: 'JWT013',
    title: 'Insecure Cookie Storage Configuration',
    description: 'The cookie used to store the JWT is missing critical security attributes like HttpOnly, Secure, or SameSite.',
    severity: 'medium',
    currentRisk: 'Cookies can be extracted via XSS (missing HttpOnly) or transmitted in plaintext (missing Secure).',
    quantumRisk: 'None.',
    recommendation: 'Set HttpOnly, Secure, and SameSite (Strict or Lax) flags on all cookie definitions.',
    references: ['OWASP Cookie Security Cheat Sheet']
  },
  JWT014: {
    id: 'JWT014',
    title: 'Long-lived Access Token',
    description: 'Access tokens have excessively long lifetimes (e.g. greater than 24 hours), increasing the exploit window if a token is compromised.',
    severity: 'medium',
    currentRisk: 'Extended abuse window for leaked/stolen tokens.',
    quantumRisk: 'None.',
    recommendation: 'Keep access token lifetimes short (e.g. 15 minutes to 1 hour) and use rotating refresh tokens for longer sessions.',
    references: ['RFC 8725 Section 2.1']
  },
  JWT015: {
    id: 'JWT015',
    title: 'Expired Token Accepted',
    description: 'The JWT verification configuration is set to ignore token expiration claims (e.g. ignoreExpiration=true).',
    severity: 'high',
    currentRisk: 'Allows usage of old, compromised, or revoked tokens.',
    quantumRisk: 'None.',
    recommendation: 'Enforce expiration validation checks in all verification logic.',
    references: ['RFC 7519', 'RFC 8725 Section 2.1']
  },
  JWT016: {
    id: 'JWT016',
    title: 'Weak or Deprecated Algorithm',
    description: 'The JWT header uses a weak, deprecated, or custom algorithm (e.g., RSA1_5, A128CBC-HS256) instead of modern standards.',
    severity: 'high',
    currentRisk: 'Vulnerable to padding oracle attacks or classical cryptanalysis.',
    quantumRisk: 'None.',
    recommendation: 'Upgrade to modern algorithms (RS256, PS256, ES256, or EdDSA).',
    references: ['RFC 7518', 'RFC 8725 Section 3.2']
  },
  JWT017: {
    id: 'JWT017',
    title: 'Insecure JWE Configuration',
    description: 'The JWE (JSON Web Encryption) token uses insecure key management or encryption configurations, such as direct key encryption ("alg=dir") with static keys.',
    severity: 'high',
    currentRisk: 'Loss of token confidentiality and private key recovery.',
    quantumRisk: 'None.',
    recommendation: 'Use key wrap/key encapsulation mechanisms (e.g., ECDH-ES, RSA-OAEP-256) instead of static direct encryption.',
    references: ['RFC 7516', 'RFC 8725 Section 3.2']
  },
  JWT018: {
    id: 'JWT018',
    title: 'Unsafe OIDC/OAuth Authority Configuration',
    description: 'The OpenID Connect or OAuth 2.0 authority endpoint is dynamically loaded from untrusted user inputs or lacks signature checks.',
    severity: 'high',
    currentRisk: 'Authentication bypass by redirecting token authority to attacker-controlled servers.',
    quantumRisk: 'None.',
    recommendation: 'Hardcode trusted authority domains or use strict allowlist validation.',
    references: ['RFC 8725']
  },
  JWT019: {
    id: 'JWT019',
    title: 'Duplicate Key Identifier (kid) in JWKS',
    description: 'A duplicate key identifier (kid) was detected in the JSON Web Key Set (JWKS), creating ambiguity in key lookup.',
    severity: 'medium',
    currentRisk: 'Key retrieval collision, resulting in validation bypass or DOS.',
    quantumRisk: 'None.',
    recommendation: 'Ensure all keys in the JWKS have a globally unique kid.',
    references: ['RFC 7517 Section 4.5']
  },
  JWT020: {
    id: 'JWT020',
    title: 'Missing Key Rotation Strategy',
    description: 'The signing keys are never rotated or lack a programmatic key rotation strategy.',
    severity: 'medium',
    currentRisk: 'Key compromise is permanent until manual system migration.',
    quantumRisk: 'None.',
    recommendation: 'Implement programmatic key rotation via JWKS endpoints.',
    references: ['RFC 8725 Section 3.9']
  },
  JWTB001: {
    id: 'JWTB001',
    title: 'JWT Best Practices Recommendation',
    description: 'Informational finding indicating that the token setup matches standard best practices but could be hardened (e.g. short-lived access tokens, refresh token rotation).',
    severity: 'info',
    currentRisk: 'None. Safe operation, but optimization opportunities exist.',
    quantumRisk: 'None.',
    recommendation: 'Follow standard JWS/JWE configurations and implement regular token rotations.',
    references: ['RFC 8725', 'OWASP JWT Cheat Sheet']
  }
};
