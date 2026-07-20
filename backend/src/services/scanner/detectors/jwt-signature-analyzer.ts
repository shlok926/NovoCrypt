export interface SignatureAuditMatch {
  issue: 'AlgorithmConfusion' | 'DisabledVerification' | 'SignatureBypass' | 'UnsafeVerifyCallback';
  api: string;
  description: string;
  matchedString: string;
}

export class SignatureAnalyzer {
  public analyzeLine(line: string, astNodes?: any): SignatureAuditMatch | null {
    // 1. HS/RS confusion indicator: verify called without algorithm restrictions, or algorithms accepting user input
    // e.g., jwt.verify(token, publicKey) without specifying algorithms parameter
    const verifyWithoutAlg = /jwt\.verify\(\s*[^,]+,\s*[^,]+(?:\s*\))|jwt\.verify\(\s*[^,]+,\s*[^,]+,\s*(?:function|\([^)]*\)\s*=>)/i;
    if (verifyWithoutAlg.test(line) && !line.includes('algorithms') && !line.includes('Algorithm')) {
      return {
        issue: 'AlgorithmConfusion',
        api: 'jwt.verify',
        description: 'JSON Web Token verification executed without specifying allowed algorithms. Allows algorithm confusion attacks (HS256 vs RS256).',
        matchedString: line.trim()
      };
    }

    // 2. Disabled verification
    // e.g. verify(false) or ignoreSignature=true or similar options
    const disabledVerification = /(verify\(\s*false\b|ignoreSignature\s*:\s*true)/i;
    const disabledMatch = disabledVerification.exec(line);
    if (disabledMatch) {
      return {
        issue: 'DisabledVerification',
        api: disabledMatch[0],
        description: 'JWT signature verification check is explicitly disabled.',
        matchedString: line.trim()
      };
    }

    // 3. Signature Bypass (e.g. decode used instead of verify)
    const signatureBypass = /(jwt\.decode\(\s*[^,]+[^)]*\))/i;
    const bypassMatch = signatureBypass.exec(line);
    if (bypassMatch) {
      // Make sure it's not a verify check that also decodes
      if (!line.includes('verify')) {
        return {
          issue: 'SignatureBypass',
          api: 'jwt.decode',
          description: 'JWT is decoded without execution of signature verification checks.',
          matchedString: bypassMatch[0]
        };
      }
    }

    // 4. Unsafe Verify Callbacks (e.g. custom key retrieval functions that dynamically accept algorithms from token headers)
    const unsafeCallback = /(function\s*\(\s*header\s*,\s*callback\s*\)|getKey\s*=\s*\(header\s*,\s*callback\)|algorithms\s*:\s*\[\s*header\.alg\s*\])/i;
    const callbackMatch = unsafeCallback.exec(line);
    if (callbackMatch) {
      return {
        issue: 'UnsafeVerifyCallback',
        api: callbackMatch[0],
        description: 'Unsafe verification callback pattern matching the header algorithms property dynamically.',
        matchedString: line.trim()
      };
    }

    return null;
  }
}
