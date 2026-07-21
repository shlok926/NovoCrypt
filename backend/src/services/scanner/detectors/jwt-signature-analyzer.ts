import { JWT_REGEX } from '../utils/regex';

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
    const verifyWithoutAlg = JWT_REGEX.VERIFY_WITHOUT_ALG;
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
    const disabledVerification = JWT_REGEX.DISABLED_VERIFY;
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
    const signatureBypass = JWT_REGEX.SIGNATURE_BYPASS;
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
    const unsafeCallback = JWT_REGEX.UNSAFE_CALLBACK;
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
