export interface ApiUsageMatch {
  issue: 'StaticNonce' | 'CustomCurve' | 'UnsafeDefault' | 'WeakEntropy';
  api: string;
  description: string;
  matchedString: string;
}

export class ApiUsageAnalyzer {
  public analyzeLine(line: string, astNodes?: any): ApiUsageMatch | null {
    // 1. Static Nonce / custom k parameter
    // Look for static nonce patterns (e.g. hardcoded hex or numeric constant assigned to nonce/k)
    const staticNonceRegex = /\b(nonce|k|iv)\s*=\s*(?:['"`]([0-9a-fA-F]{8,})['"`]|\b0x[0-9a-fA-F]+\b|\b\d+\b|Buffer\.from\(['"`]([0-9a-fA-F]{8,})['"`]\))/i;
    const staticNonceMatch = staticNonceRegex.exec(line);
    if (staticNonceMatch && !line.includes('random') && !line.includes('generate')) {
      return {
        issue: 'StaticNonce',
        api: 'nonce assignment',
        description: 'Hardcoded or static nonce detected. Reusing nonces in ECDSA/ECDH is critically insecure and can lead to immediate private key extraction.',
        matchedString: staticNonceMatch[0]
      };
    }

    // 2. Custom curves
    // e.g., manual instantiation of curve parameters, ECParameterSpec or EllipticCurve in Java/C#/Python
    const customCurveRegex = /(new\s+ECParameterSpec\s*\(|new\s+EllipticCurve\s*\(|ec\.Curve\s*\(|elliptic\.curve\s*\()/i;
    const customCurveMatch = customCurveRegex.exec(line);
    if (customCurveMatch) {
      return {
        issue: 'CustomCurve',
        api: 'Custom curve parameter specification',
        description: 'Custom elliptic curve parameters manually defined. Custom curves have high risk of mathematical backdoors or weak parameter selection.',
        matchedString: customCurveMatch[0]
      };
    }

    // 3. Unsafe Defaults
    // e.g. key generator initialized without curve params, which may default to legacy curves
    const unsafeDefaultRegex = /(KeyPairGenerator\.getInstance\(['"`]EC['"`]\)\s*(?!.*?initialize))/i;
    const unsafeDefaultMatch = unsafeDefaultRegex.exec(line);
    if (unsafeDefaultMatch) {
      return {
        issue: 'UnsafeDefault',
        api: 'KeyPairGenerator EC without initialize',
        description: 'KeyPairGenerator for EC instantiated without explicit initialization. This relies on library-dependent defaults, which may default to weak/deprecated curves.',
        matchedString: unsafeDefaultMatch[0]
      };
    }

    return null;
  }
}
