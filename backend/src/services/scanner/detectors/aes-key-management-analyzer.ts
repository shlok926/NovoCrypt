export interface KeyMgmtMatch {
  issue: 'HardcodedKey' | 'DevelopmentKey' | 'EmbeddedSecret';
  api: string;
  description: string;
  matchedString: string;
}

export class KeyManagementAnalyzer {
  public analyzeLine(line: string, astNodes?: any): KeyMgmtMatch | null {
    // 1. Hardcoded AES Key assignment
    // Match keys defined as string literals or hex assignments:
    // e.g. const aesKey = 'this_is_a_hardcoded_key' or secretKey = 'abc'
    const keyAssignRegex = /(?:aesKey|aes_key|secretKey|secret_key|crypto_key|cipherKey|cipher_key)\s*=\s*["'`]([^"'`]{1,256})["'`]/i;
    const assignMatch = keyAssignRegex.exec(line);
    
    if (assignMatch) {
      const keyVal = assignMatch[1];
      
      // Development keys check
      const devKeyRegex = /(test|demo|dev|dummy|temp|placeholder|123456|password|debug)/i;
      if (devKeyRegex.test(keyVal)) {
        return {
          issue: 'DevelopmentKey',
          api: assignMatch[0],
          description: `Development/test key constant detected: "${keyVal}". Insecure for production deployments.`,
          matchedString: assignMatch[0]
        };
      }

      // If it's a hardcoded secret in config (excluding env variables references)
      if (!keyVal.includes('process.env') && !keyVal.includes('config')) {
        return {
          issue: 'HardcodedKey',
          api: assignMatch[0],
          description: 'Hardcoded symmetric key value configured. Exposed to source code leakage.',
          matchedString: assignMatch[0]
        };
      }
    }

    // 2. Embedded Cryptographic Secrets in configuration structures
    // Matches e.g. "aes_key": "some_value" or aes_key = "value" inside json/yaml
    const embeddedSecretRegex = /["'`]?(?:aesKey|aes_key|symmetric_key)["'`]?\s*[:=]\s*["'`]([^"'`]+)["'`]/i;
    const embeddedMatch = embeddedSecretRegex.exec(line);
    if (embeddedMatch && !embeddedMatch[1].includes('env') && embeddedMatch[1].length > 10) {
      return {
        issue: 'EmbeddedSecret',
        api: embeddedMatch[0],
        description: 'Embedded cryptographic secret detected inside config properties.',
        matchedString: embeddedMatch[0]
      };
    }

    return null;
  }
}
