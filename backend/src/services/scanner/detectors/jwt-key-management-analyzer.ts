export interface KeyMgmtMatch {
  issue: 'HardcodedSecret' | 'WeakSecret' | 'DefaultSecret' | 'UnsafeJWKS' | 'DuplicateKid' | 'MissingRotation';
  api: string;
  description: string;
  matchedString: string;
}

export class KeyManagementAnalyzer {
  public analyzeLine(line: string, astNodes?: any): KeyMgmtMatch | null {
    // 1. Default Secrets (common placeholders)
    const defaultSecretRegex = /(secret|temp|placeholder|123456|password|admin|auth_key|jwt_secret_key)\s*["'`]?\s*$/i;
    const jwtAssignRegex = /(?:jwt_secret|jwtSecret|signingKey|signing_secret|token_secret)\s*=\s*["'`]([^"'`]{1,256})["'`]/i;
    const assignMatch = jwtAssignRegex.exec(line);
    if (assignMatch) {
      const secretValue = assignMatch[1];
      if (defaultSecretRegex.test(secretValue)) {
        return {
          issue: 'DefaultSecret',
          api: assignMatch[0],
          description: `Default/placeholder secret key configured: "${secretValue}". Attackers can immediately offline-bruteforce signature verification.`,
          matchedString: assignMatch[0]
        };
      }
      
      // 2. Weak secrets (< 32 bytes)
      if (secretValue.length < 32) {
        return {
          issue: 'WeakSecret',
          api: assignMatch[0],
          description: `Symmetric HMAC secret key is too short (${secretValue.length} characters). HMAC keys must have at least 256 bits (32 bytes) of entropy to resist dictionary attacks.`,
          matchedString: assignMatch[0]
        };
      }

      // 3. Hardcoded Secret (not loaded from process.env)
      if (!secretValue.includes('process.env') && !secretValue.includes('config')) {
        return {
          issue: 'HardcodedSecret',
          api: assignMatch[0],
          description: 'Hardcoded secret detected. Secrets should be externalized via environmental variables or secure KMS vaults.',
          matchedString: assignMatch[0]
        };
      }
    }

    // 4. JWKS Configuration issues
    // e.g. jwksUri loading over insecure HTTP endpoint, duplicate kid checks, cache lifetimes
    const jwksUriRegex = /jwksUri\s*:\s*["'`](http:\/\/[^"'`]+)["'`]/i;
    const jwksMatch = jwksUriRegex.exec(line);
    if (jwksMatch) {
      return {
        issue: 'UnsafeJWKS',
        api: jwksMatch[0],
        description: 'Retrieving JSON Web Key Set (JWKS) endpoint over insecure HTTP transport protocol.',
        matchedString: jwksMatch[0]
      };
    }

    // Unsafe caching in JWKS setups
    const unsafeCacheRegex = /(jwksRequestsPerMinute|cacheMaxAge|jwksCache)\s*:\s*(?:Infinity|undefined|null|0)/i;
    const cacheMatch = unsafeCacheRegex.exec(line);
    if (cacheMatch) {
      return {
        issue: 'UnsafeJWKS',
        api: cacheMatch[0],
        description: 'Unsafe or infinite cache parameters configured on remote JWKS client, increasing cache poisoning risks.',
        matchedString: cacheMatch[0]
      };
    }

    return null;
  }
}
