import { AES_REGEX } from '../utils/regex';

export interface BestPracticeMatch {
  practice: string;
  description: string;
  matchedString: string;
}

export class BestPracticesAnalyzer {
  public analyzeLine(line: string, astNodes?: any): BestPracticeMatch | null {
    // Audit configurations that conform to safe AEAD structures
    // e.g. using aes-256-gcm or AES/GCM/NoPadding
    const safeRegex = AES_REGEX.SAFE_AES;
    const match = safeRegex.exec(line);
    if (match) {
      return {
        practice: 'Authenticated AES-GCM',
        description: `Conforms to best practice: symmetric cipher initialized using secure authenticated encryption mode (${match[1]}).`,
        matchedString: match[0]
      };
    }

    return null;
  }
}
