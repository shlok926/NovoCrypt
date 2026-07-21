import { JWT_REGEX } from '../utils/regex';

export interface ApiUsageMatch {
  issue: 'ExpiredTokenAccepted' | 'SignatureBypass';
  api: string;
  description: string;
  matchedString: string;
}

export class ApiUsageAnalyzer {
  public analyzeLine(line: string, astNodes?: any): ApiUsageMatch | null {
    // 1. Expiration validation bypass (ignoreExpiration=true)
    const ignoreExpirationRegex = JWT_REGEX.IGNORE_EXPIRATION;
    const ignoreMatch = ignoreExpirationRegex.exec(line);
    if (ignoreMatch) {
      return {
        issue: 'ExpiredTokenAccepted',
        api: ignoreMatch[0],
        description: 'Verification is configured to accept expired tokens (ignoreExpiration: true). This allows old, compromised tokens to remain active.',
        matchedString: line.trim()
      };
    }

    // 2. Decode without verification
    const decodeOnlyRegex = JWT_REGEX.DECODE_ONLY;
    const decodeMatch = decodeOnlyRegex.exec(line);
    if (decodeMatch && !line.includes('verify')) {
      return {
        issue: 'SignatureBypass',
        api: decodeMatch[0],
        description: 'JWT is decoded and consumed without signature validation checks.',
        matchedString: decodeMatch[0]
      };
    }

    return null;
  }
}
