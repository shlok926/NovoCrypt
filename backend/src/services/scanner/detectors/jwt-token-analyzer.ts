import { TokenType } from './jwt-types';
import { JWT_REGEX } from '../utils/regex';

export interface TokenMatch {
  type: TokenType;
  alg?: string;
  isMalformed: boolean;
  isUnsecured: boolean;
  matchedString: string;
  partsCount: number;
}

export class TokenAnalyzer {
  public analyzeLine(line: string, astNodes?: any): TokenMatch[] {
    const results: TokenMatch[] = [];
    
    // Regex to match candidate JWT/JWS (3 segments of base64url) or JWE (5 segments of base64url)
    // Matches strings in code, variables, configs
    const jwtCandidateRegex = JWT_REGEX.CANDIDATE;
    
    let match;
    while ((match = jwtCandidateRegex.exec(line)) !== null) {
      const fullToken = match[0];
      const parts = fullToken.split('.');
      const partsCount = parts.length;
      
      let tokenType: TokenType = 'JWS';
      let isUnsecured = false;
      let alg = '';
      let isMalformed = false;

      if (partsCount === 5) {
        tokenType = 'JWE';
      } else if (partsCount === 3) {
        tokenType = 'JWS';
      } else {
        isMalformed = true;
        tokenType = 'Malformed';
      }

      if (partsCount === 3 || partsCount === 5) {
        try {
          const headerJson = Buffer.from(parts[0], 'base64').toString('utf8');
          if (headerJson.startsWith('{') && headerJson.endsWith('}')) {
            const header = JSON.parse(headerJson);
            alg = header.alg;
            if (alg && alg.toLowerCase() === 'none') {
              tokenType = 'Unsecured';
              isUnsecured = true;
            }
          } else {
            isMalformed = true;
          }
        } catch {
          isMalformed = true;
        }
      }

      // Check for base64url validity of segments
      for (const part of parts) {
        if (!/^[a-zA-Z0-9_-]*$/.test(part)) {
          isMalformed = true;
        }
      }

      results.push({
        type: tokenType,
        alg,
        isMalformed,
        isUnsecured,
        matchedString: fullToken,
        partsCount
      });
    }

    // Direct string keyword scans for configuration parameters (e.g. alg: "none", "alg": "none")
    if (results.length === 0) {
      const noneConfigRegex = JWT_REGEX.NONE_CONFIG;
      if (noneConfigRegex.test(line)) {
        results.push({
          type: 'Unsecured',
          alg: 'none',
          isMalformed: false,
          isUnsecured: true,
          matchedString: line.trim(),
          partsCount: 3
        });
      }
    }

    return results;
  }
}
