import { Rule } from '../types';

export const aesRules: Record<string, Rule> = {
  AES001: {
    id: 'AES001',
    title: 'ECB Mode of Operation',
    description: 'Electronic Codebook (ECB) encrypts identical plaintext blocks into identical ciphertext blocks, leaking patterns.',
    severity: 'critical',
    currentRisk: 'Plaintext values are visually identifiable in structural ciphertexts, exposing transactional databases or assets.',
    quantumRisk: 'None.',
    recommendation: 'Use secure authenticated encryption modes like AES-GCM or AES-SIV instead.',
    references: ['NIST SP 800-38A']
  },
  AES002: {
    id: 'AES002',
    title: 'Static IV Usage',
    description: 'Using a fixed/static Initialization Vector (IV) destroys the semantic security of block cipher modes like CBC, CTR, or GCM.',
    severity: 'high',
    currentRisk: 'Allows attackers to identify message boundaries and decrypt ciphertexts via block comparison.',
    quantumRisk: 'None.',
    recommendation: 'Generate a unique, cryptographically secure random IV for every encryption call.',
    references: ['RFC 5084']
  },
  AES003: {
    id: 'AES003',
    title: 'Zero IV Usage',
    description: 'An IV populated with zero bytes (all 0x00) is highly predictable and removes block diversity.',
    severity: 'high',
    currentRisk: 'Plaintext encryption states are exposed to replay and pre-calculated dictionary attacks.',
    quantumRisk: 'None.',
    recommendation: 'Use a secure CSPRNG (e.g. crypto.randomBytes) to instantiate non-zero random initialization vectors.',
    references: ['NIST SP 800-38D']
  },
  AES004: {
    id: 'AES004',
    title: 'Nonce / IV Reuse',
    description: 'Reusing the same IV/nonce with the same key in GCM or CTR modes allows plaintexts to be recovered via XOR offsets.',
    severity: 'high',
    currentRisk: 'Breaks keystream integrity, leading to decryption of message streams.',
    quantumRisk: 'None.',
    recommendation: 'Enforce non-repeating counter parameters or unique nonce allocation per encryption event.',
    references: ['RFC 5116']
  },
  AES005: {
    id: 'AES005',
    title: 'Hardcoded Symmetric Key',
    description: 'Cryptographic keys are hardcoded as static string literals in source configurations.',
    severity: 'high',
    currentRisk: 'Symmetric keys can be leaked through code repositories or decompilation, compromising all encrypted assets.',
    quantumRisk: 'None.',
    recommendation: 'Externalize symmetric key configurations via environmental variables or load from secure vaults/KMS.',
    references: ['OWASP ASVS v4.0']
  },
  AES006: {
    id: 'AES006',
    title: 'Weak AES Key Size',
    description: 'Symmetric keys configured with lengths other than 128, 192, or 256 bits degrade execution parameters.',
    severity: 'high',
    currentRisk: 'Invalid key size limits cause execution errors or trigger fallback legacy configurations.',
    quantumRisk: 'None.',
    recommendation: 'Generate a standard AES-256 bit key using a cryptographically secure random source.',
    references: ['FIPS 197']
  },
  AES007: {
    id: 'AES007',
    title: 'Weak Randomness Source',
    description: 'Insecure PRNG APIs (like Math.random) are utilized to populate critical secrets, keys, or nonces.',
    severity: 'high',
    currentRisk: 'Attackers can predict output states, predetermine key materials, and bypass authentication controls.',
    quantumRisk: 'None.',
    recommendation: 'Use platform-provided CSPRNG APIs (e.g. crypto.randomBytes in Node, SecureRandom in Java, crypto/rand in Go).',
    references: ['RFC 4086']
  },
  AES008: {
    id: 'AES008',
    title: 'Unauthenticated Encryption Mode',
    description: 'Using unauthenticated symmetric modes (like CBC or CTR) leaves encrypted content open to bit-flipping attacks.',
    severity: 'high',
    currentRisk: 'Allows active attackers to modify encrypted data in transit or storage without detection.',
    quantumRisk: 'None.',
    recommendation: 'Transition cipher architectures to authenticated AEAD encryption (e.g., AES-GCM or AES-SIV).',
    references: ['ISO/IEC 19772']
  },
  AES009: {
    id: 'AES009',
    title: 'Missing Tag Validation',
    description: 'Decryption callbacks for AEAD modes (GCM) do not verify the authentication tag, rendering checks useless.',
    severity: 'high',
    currentRisk: 'Attackers can feed modified ciphertexts without validation checks returning failures.',
    quantumRisk: 'None.',
    recommendation: 'Always explicitly verify the authentication tag returned during AEAD decryption.',
    references: ['NIST SP 800-38D']
  },
  AES010: {
    id: 'AES010',
    title: 'Weak PBKDF2 Configuration',
    description: 'Low iteration counts or weak hashing functions degrade key derivation performance against brute force attacks.',
    severity: 'medium',
    currentRisk: 'Attackers can execute high-speed offline dictionary attacks to crack derivation passwords.',
    quantumRisk: 'None.',
    recommendation: 'Enforce PBKDF2 iteration configurations of at least 600,000 rounds combined with SHA-256.',
    references: ['OWASP Password Storage Cheat Sheet']
  },
  AES011: {
    id: 'AES011',
    title: 'Weak Argon2 Parameters',
    description: 'Low memory or time cost options make Argon2 key derivation susceptible to hardware acceleration cracking.',
    severity: 'medium',
    currentRisk: 'Enables offline GPU/ASIC parallel dictionary attacks.',
    quantumRisk: 'None.',
    recommendation: 'Configure Argon2id to recommended OWASP limits (e.g. 19MB memory cost, time cost = 2).',
    references: ['RFC 9106']
  },
  AES012: {
    id: 'AES012',
    title: 'Weak scrypt Parameters',
    description: 'Low resource parameters in scrypt make computing memory requirements trivial.',
    severity: 'medium',
    currentRisk: 'Facilitates fast, low-cost password brute force setups.',
    quantumRisk: 'None.',
    recommendation: 'Configure scrypt memory costs to secure limits (e.g., N=16384, r=8, p=1).',
    references: ['RFC 7914']
  },
  AES013: {
    id: 'AES013',
    title: 'Cipher Context Reuse',
    description: 'Reusing a single cipher state or object context across multiple encryption tasks.',
    severity: 'high',
    currentRisk: 'Leaks key stream states or breaks structural nonce assertions.',
    quantumRisk: 'None.',
    recommendation: 'Instantiate a fresh cipher context for every cryptographic transaction.',
    references: ['OWASP ASVS']
  },
  AES014: {
    id: 'AES014',
    title: 'Padding Oracle Risk',
    description: 'Decrypting padded symmetric block ciphers without authentication exposes the system to timing and oracle attacks.',
    severity: 'high',
    currentRisk: 'Enables complete plaintext decryption block-by-block using response timing side channels.',
    quantumRisk: 'None.',
    recommendation: 'Verify integrity using MAC signatures (Encrypt-then-MAC) or migrate to AEAD GCM mode.',
    references: ['RFC 8725']
  },
  AES015: {
    id: 'AES015',
    title: 'Unsafe Symmetric API Usage',
    description: 'Wrong parameter order or incomplete finalize callbacks leaves decryption incomplete.',
    severity: 'medium',
    currentRisk: 'Data corruption or resource leak issues in cipher pipelines.',
    quantumRisk: 'None.',
    recommendation: 'Verify input types and ensure all finalize() callbacks are successfully executed.',
    references: ['NIST SP 800-38A']
  },
  AES016: {
    id: 'AES016',
    title: 'Missing Key Rotation Strategy',
    description: 'Symmetric keys are utilized infinitely without rotation configurations or retirement policies.',
    severity: 'medium',
    currentRisk: 'If a key is compromised, historical and future ciphertexts remain permanently exposed.',
    quantumRisk: 'None.',
    recommendation: 'Establish periodic key retirement intervals and implement rotation patterns.',
    references: ['NIST SP 800-57']
  },
  AES017: {
    id: 'AES017',
    title: 'Constant Nonce Usage',
    description: 'Hardcoded or fixed nonces applied to GCM/CCM encryption loops.',
    severity: 'high',
    currentRisk: 'Completely eliminates GCM AEAD integrity checks and leaks plaintext context.',
    quantumRisk: 'None.',
    recommendation: 'Generate unique nonces dynamically using a secure CSPRNG.',
    references: ['RFC 5116']
  },
  AES018: {
    id: 'AES018',
    title: 'Weak Key Derivation Function',
    description: 'Using insecure or deprecated functions (e.g. single MD5 rounds) to derive symmetric keys.',
    severity: 'high',
    currentRisk: 'Enables collision attacks and low-effort offline key recovery.',
    quantumRisk: 'None.',
    recommendation: 'Use HKDF or PBKDF2 for key derivation tasks.',
    references: ['RFC 5869']
  },
  AES019: {
    id: 'AES019',
    title: 'Development Key Material',
    description: 'Placeholder key constants or test strings (e.g. "test_aes_key") found in cryptographic setup code.',
    severity: 'medium',
    currentRisk: 'Test/debug keys might accidentally leak into production environment profiles.',
    quantumRisk: 'None.',
    recommendation: 'Restrict cryptographic key setup to KMS scopes and verify debug blocks are removed.',
    references: ['OWASP ASVS']
  },
  AES020: {
    id: 'AES020',
    title: 'Embedded Cryptographic Secret',
    description: 'Cryptographic credentials or keys found inside structural configuration profiles (like JSON or YAML files).',
    severity: 'medium',
    currentRisk: 'Exposes symmetric keys to configuration repository analysis.',
    quantumRisk: 'None.',
    recommendation: 'Migrate configuration properties to production environmental variables.',
    references: ['OWASP ASVS']
  },
  AES021: {
    id: 'AES021',
    title: 'Weak Authentication Tag Length',
    description: 'AEAD tags configured below standard safe margins (e.g., < 96 bits / 12 bytes), allowing forgery attacks.',
    severity: 'high',
    currentRisk: 'Increases tag collision probability, enabling attackers to forge valid payloads.',
    quantumRisk: 'None.',
    recommendation: 'Configure standard 128-bit authentication tags (16 bytes) in AEAD modes.',
    references: ['NIST SP 800-38D']
  },
  AES022: {
    id: 'AES022',
    title: 'Missing Additional Authenticated Data (AAD)',
    description: 'AEAD operations conducted without binding non-encrypted structural metadata.',
    severity: 'medium',
    currentRisk: 'Replay or redirect attacks where encrypted payloads are mapped to wrong users or scopes.',
    quantumRisk: 'None.',
    recommendation: 'Pass routing variables or headers as AAD during AEAD setup.',
    references: ['RFC 5116']
  },
  AES023: {
    id: 'AES023',
    title: 'Deprecated Cryptographic API Usage',
    description: 'Using legacy cryptographic libraries or classes (like DES, 3DES, RC4, or Node\'s legacy createCipher).',
    severity: 'medium',
    currentRisk: 'Subject to known attacks and lack of vendor security updates.',
    quantumRisk: 'None.',
    recommendation: 'Transition to active, secure platform APIs (e.g. createCipheriv in Node).',
    references: ['NIST SP 800-131A']
  },
  AES024: {
    id: 'AES024',
    title: 'Predictable Salt Value',
    description: 'Salts in key derivation setups derived from predictable indicators, static strings, or timestamps.',
    severity: 'high',
    currentRisk: 'Allows pre-computed rainbow table dictionary attacks against derived credentials.',
    quantumRisk: 'None.',
    recommendation: 'Generate unique salts dynamically using a secure CSPRNG.',
    references: ['NIST SP 800-132']
  },
  AES025: {
    id: 'AES025',
    title: 'Reused KDF Salt',
    description: 'Deriving symmetric keys for separate scopes using a constant/shared salt value.',
    severity: 'high',
    currentRisk: 'Identical input credentials yield identical derived keys, enabling batch offline cracking.',
    quantumRisk: 'None.',
    recommendation: 'Enforce unique salts per derivation event.',
    references: ['NIST SP 800-132']
  },
  AESB001: {
    id: 'AESB001',
    title: 'Symmetric Encryption Best Practices',
    description: 'Symmetric encryption matches secure standards, but minor optimization opportunities exist.',
    severity: 'info',
    currentRisk: 'None. Safe operation.',
    quantumRisk: 'None.',
    recommendation: 'Follow standard AES configurations and monitor updates.',
    references: ['RFC 8725', 'OWASP Cheat Sheet']
  }
};
