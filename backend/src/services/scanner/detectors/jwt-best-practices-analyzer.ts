export interface BestPracticeMatch {
  practice: string;
  description: string;
  matchedString: string;
}

export class JwtBestPracticesAnalyzer {
  public analyzeLine(line: string, astNodes?: any): BestPracticeMatch | null {
    // Audit configurations that conform to good rotation or short access windows
    // e.g. expiresIn set to '15m', '30m', '1h'
    const shortLivedRegex = /expiresIn\s*:\s*["'`](15m|30m|1h|900|1800|3600)["'`]/i;
    const match = shortLivedRegex.exec(line);
    if (match) {
      return {
        practice: 'Short-lived token',
        description: `Conforms to best practice: access token configured with short expiration duration (${match[1]}).`,
        matchedString: match[0]
      };
    }

    return null;
  }
}
