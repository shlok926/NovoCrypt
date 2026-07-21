import { PQC_REGEX } from '../utils/regex';

export interface BestPracticeMatch {
  practice: string;
  description: string;
  matchedString: string;
}

export class BestPracticesAnalyzer {
  public analyzeLine(line: string, astNodes?: any): BestPracticeMatch | null {
    // Audit configurations that conform to safe PQC agility / standards
    // e.g. using ml-kem-768 or ml-dsa-65 or secure hybrid KEMs
    const safeRegex = PQC_REGEX.SAFE_PQC;
    const match = safeRegex.exec(line);
    if (match) {
      return {
        practice: 'Standardized NIST PQC',
        description: `Conforms to best practice: symmetric/asymmetric cipher initialized using standardized post-quantum configurations (${match[1]}).`,
        matchedString: match[0]
      };
    }

    return null;
  }
}
