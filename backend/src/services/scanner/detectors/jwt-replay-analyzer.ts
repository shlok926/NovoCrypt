import { JWT_REGEX } from '../utils/regex';

export interface ReplayMatch {
  issue: 'ReplayProtectionMissing';
  api: string;
  description: string;
  matchedString: string;
}

export class ReplayProtectionAnalyzer {
  public analyzeLine(line: string, astNodes?: any): ReplayMatch | null {
    // 1. Missing replay parameters in sign configurations
    // Check if key configurations are missing jti, nonce, or state variables
    const signConfigRegex = JWT_REGEX.SIGN_CONFIG;
    const match = signConfigRegex.exec(line);
    if (match) {
      const payloadContent = match[1];
      const missingJti = !payloadContent.includes('jti');
      const missingNonce = !payloadContent.includes('nonce') && !line.includes('nonce');
      const missingState = !payloadContent.includes('state') && !line.includes('state');

      if (missingJti && missingNonce && missingState) {
        return {
          issue: 'ReplayProtectionMissing',
          api: 'jwt.sign',
          description: 'JWT payload configuration is missing replay protection attributes (jti, nonce, state). Stolen tokens can be replayed indefinitely within their active window.',
          matchedString: match[0]
        };
      }
    }

    return null;
  }
}
