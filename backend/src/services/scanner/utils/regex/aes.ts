export const AES_REGEX = {
  // Matches Math.random() or non-cryptographic PRNGs
  WEAK_RANDOM: /\b(Math\.random\(\)|random\.random\(\)|random\.randint\(\)|new\s+Random\(\))/i,
  
  // Matches ZeroPadding or NoPadding configs
  ZERO_PADDING: /\b(ZeroPadding|NoPadding|No-Padding|zero-padding)\b/i,
  
  // Matches PKCS5 or PKCS7 padding configs
  PKCS_PADDING: /\b(PKCS5Padding|PKCS7Padding|PKCS5|PKCS7)\b/i,
  
  // Matches iteration count configuration in PBKDF2
  PBKDF2_ITERATIONS: /(?:iterations|iters|iterCount)\s*:\s*\b([1-9]\d{0,4}|[1-5]\d{5})\b/i,
  
  // Matches positional iteration counts in Node pbkdf2Sync or similar
  PBKDF2_POSITIONAL: /pbkdf2(?:Sync)?\(\s*[^,]+,\s*[^,]+,\s*\b([1-9]\d{0,4}|[1-5]\d{5})\b/i,
  
  // Matches memory limits in Argon2id
  ARGON2_MEMORY: /(?:memoryCost|mCost|memory)\s*:\s*\b([1-9]\d{0,3}|1[0-5]\d{3})\b/i,
  
  // Matches cost parameters in scrypt
  SCRYPT_N: /(?:costFactor|N|cost)\s*:\s*\b([1-9]\d{0,3}|1[0-5]\d{3})\b/i,
  
  // Matches predictable custom salts
  PREDICTABLE_SALT: /(?:salt|saltValue)\s*=\s*["'`]([^"'`]{1,40})["'`]/i,
  
  // Matches static AES assignment statements
  KEY_ASSIGN: /(?:aesKey|aes_key|secretKey|secret_key|crypto_key|cipherKey|cipher_key)\s*=\s*["'`]([^"'`]{1,256})["'`]/i,
  
  // Matches typical developer test keys
  DEV_KEY: /(test|demo|dev|dummy|temp|placeholder|123456|password|debug)/i,
  
  // Matches embedded JSON/string secrets
  EMBEDDED_SECRET: /["'`]?(?:aesKey|aes_key|symmetric_key)["'`]?\s*[:=]\s*["'`]([^"'`]+)["'`]/i,
  
  // Matches allocation of empty buffers for IV
  ZERO_IV: /(?:iv|nonce)\s*=\s*(?:Buffer\.alloc\(\s*\d+\s*\)|new\s+Uint8Array\(\s*\d+\s*\)|\[\s*0\s*(?:,\s*0\s*)*\])/i,
  
  // Matches hardcoded string values used as IV
  STATIC_IV: /(?:iv|nonce)\s*=\s*(?:["'`]([^"'`]{4,64})["`']|Buffer\.from\(\s*["'`]([^"'`]+)["'`]\s*\))/i,
  
  // Matches constant numeric or literal nonces
  CONSTANT_NONCE: /(?:nonce|ivVal)\s*=\s*(?:\d+|["'`](?:fixed|static|const|nonce)["'`])/i,
  
  // Matches safe AES ciphers
  SAFE_AES: /['"`](aes-256-gcm|AES\/GCM\/NoPadding)['"`]/i,
  
  // Matches legacy/insecure ciphers
  DEPRECATED_API: /\b(createCipher\s*\(|DES\b|3DES\b|RC4\b)/i,
  
  // Matches standard AES algorithm names
  ALGORITHM: /\b(aes)[-_]?(128|192|256)\b/i,

  // Key derivation using weak hashes
  WEAK_KDF_HASH: /(?:pbkdf2|hkdf|deriveKey).*['"`](md5|sha1)['"`]/i,

  // Weak/invalid AES key length formats
  WEAK_AES: /\b(aes)[-_]?(64|512|1024)\b/i
};
