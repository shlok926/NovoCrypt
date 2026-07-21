import { AES_REGEX } from '../utils/regex';

export interface PaddingMatch {
  issue: 'PaddingOracleRisk' | 'InsecurePadding';
  api: string;
  description: string;
  matchedString: string;
}

export class PaddingAnalyzer {
  public analyzeLine(line: string, astNodes?: any): PaddingMatch | null {
    // 1. Insecure/Zero padding schemes
    // Matches e.g., zeroPadding: true or Cipher.getInstance("AES/CBC/ZeroPadding")
    const zeroPaddingRegex = AES_REGEX.ZERO_PADDING;
    const paddingMatch = zeroPaddingRegex.exec(line);
    if (paddingMatch) {
      return {
        issue: 'InsecurePadding',
        api: paddingMatch[0],
        description: `Insecure or absent symmetric block padding configuration detected: "${paddingMatch[0]}".`,
        matchedString: paddingMatch[0]
      };
    }

    // 2. Padding Oracle Risk
    // PKCS5/PKCS7 decryption operations without authentication (e.g. combined with CBC mode)
    // We flags PKCS7/PKCS5 configurations since they have padding oracle risks if decryption integrity is unverified
    const pkcsPaddingRegex = AES_REGEX.PKCS_PADDING;
    const pkcsMatch = pkcsPaddingRegex.exec(line);
    if (pkcsMatch) {
      // PKCS7 is only a risk if used with unauthenticated modes (which we flag, but let's report the padding config itself)
      return {
        issue: 'PaddingOracleRisk',
        api: pkcsMatch[0],
        description: `Block cipher padding configured with PKCS5/PKCS7: "${pkcsMatch[0]}". Susceptible to padding oracle decryption attacks if authenticated checks are missing.`,
        matchedString: pkcsMatch[0]
      };
    }

    return null;
  }
}
