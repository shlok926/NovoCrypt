export const JWT_REGEX = {
  // Regex to match candidate JWT/JWS (3 segments of base64url) or JWE (5 segments of base64url)
  CANDIDATE: /\b([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)(?:\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+))?\b/g,
  
  // jwt.verify(token, publicKey) without specifying algorithms parameter
  VERIFY_WITHOUT_ALG: /jwt\.verify\(\s*[^,]+,\s*[^,]+(?:\s*\))|jwt\.verify\(\s*[^,]+,\s*[^,]+,\s*(?:function|\([^)]*\)\s*=>)/i,
  
  // JWT is decoded without execution of signature verification checks
  SIGNATURE_BYPASS: /(jwt\.decode\(\s*[^,]+[^)]*\))/i,
  
  // LocalStorage / SessionStorage usage storing JWT tokens
  LOCAL_STORAGE: /(localStorage|sessionStorage)\.setItem\(\s*["'`](jwt|token|access_token|id_token|refresh_token)["'`](?:\s*,)?/i,
  
  // Cookie setting storing JWT tokens
  COOKIE: /res\.cookie\(\s*["'`](?:jwt|token|access_token)["'`](\s*,[^)]+)?\)/i,
  
  // JWT signing payload configuration to check replay attributes
  SIGN_CONFIG: /jwt\.sign\(\s*(\{[^}]*\})\s*,\s*[^,]+/i,

  // JWT alg=none configurations in code/settings
  NONE_CONFIG: /["'`]?alg["'`]?\s*:\s*["'`]none["'`]/i,

  // Disabled signature verification keywords
  DISABLED_VERIFY: /(verify\(\s*false\b|ignoreSignature\s*:\s*true)/i,

  // Unsafe verification callbacks that dynamically parse parameters
  UNSAFE_CALLBACK: /(function\s*\(\s*header\s*,\s*callback\s*\)|getKey\s*=\s*\(header\s*,\s*callback\)|algorithms\s*:\s*\[\s*header\.alg\s*\])/i,

  // Common default secrets and placeholder values
  DEFAULT_SECRET: /(secret|temp|placeholder|123456|password|admin|auth_key|jwt_secret_key)\s*["'`]?\s*$/i,

  // Secret assignment variables
  ASSIGN_SECRET: /(?:jwt_secret|jwtSecret|signingKey|signing_secret|token_secret)\s*=\s*["'`]([^"'`]{1,256})["'`]/i,

  // Unsafe HTTP JWKS endpoints
  JWKS_URI: /jwksUri\s*:\s*["'`](http:\/\/[^"'`]+)["'`]/i,

  // Unsafe cache setups in JWKS config
  UNSAFE_CACHE: /(jwksRequestsPerMinute|cacheMaxAge|jwksCache)\s*:\s*(?:Infinity|undefined|null|0)/i,

  // JWT signing without exp parameter
  SIGN_WITHOUT_EXP: /jwt\.sign\(\s*(\{[^}]*\})\s*,\s*[^,]+(?!.*expiresIn)/i,

  // Long-lived JWT configurations
  LONG_LIVED: /expiresIn\s*:\s*["'`](\d+(?:d|y|w|h)|never)["'`]/i,

  // JWT configuration to ignore expiration
  IGNORE_EXPIRATION: /(ignoreExpiration\s*:\s*true)/i,

  // Simple JWT decode call
  DECODE_ONLY: /(jwt\.decode\([^)]*\))/i,

  // Short-lived JWT configurations (best practice)
  SHORT_LIVED: /expiresIn\s*:\s*["'`](15m|30m|1h|900|1800|3600)["'`]/i
};
