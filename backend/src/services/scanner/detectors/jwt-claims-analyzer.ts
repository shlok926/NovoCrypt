import { JWT_REGEX } from '../utils/regex';

export interface ClaimsMatch {
  missingClaim: 'exp' | 'iss' | 'aud' | 'jti';
  api: string;
  description: string;
  matchedString: string;
}

export class ClaimsAnalyzer {
  public analyzeLine(line: string, astNodes?: any): ClaimsMatch | null {
    // 1. Missing expiration check in configuration objects
    // If sign API is configured without exp/expiresIn properties
    // e.g. jwt.sign({ sub: userId }, secret)
    const signCall = JWT_REGEX.SIGN_WITHOUT_EXP;
    const signMatch = signCall.exec(line);
    if (signMatch && !line.includes('expiresIn') && !line.includes('exp')) {
      return {
        missingClaim: 'exp',
        api: 'jwt.sign',
        description: 'Token payload or signing config is missing an expiration ("exp" or "expiresIn") property.',
        matchedString: signMatch[0]
      };
    }

    // 2. Scan configuration objects to flag long-lived tokens
    // e.g., expiresIn: '365d', '30d', '1y'
    const longLivedRegex = JWT_REGEX.LONG_LIVED;
    const longLivedMatch = longLivedRegex.exec(line);
    if (longLivedMatch) {
      const val = longLivedMatch[1];
      const isDangerous = val.endsWith('d') && parseInt(val) > 7 || val.endsWith('y') || val.endsWith('w') || val === 'never';
      if (isDangerous) {
        return {
          missingClaim: 'exp', // Categorized as lifetime configuration issue
          api: longLivedMatch[0],
          description: `Long-lived JWT token configured: ${val}. Access tokens should be short-lived to minimize compromised usage windows.`,
          matchedString: longLivedMatch[0]
        };
      }
    }

    return null;
  }
}
