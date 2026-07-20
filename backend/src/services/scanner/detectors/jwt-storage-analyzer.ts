export interface StorageMatch {
  issue: 'LocalStorageUsage' | 'CookieSecurityMisconfiguration';
  api: string;
  description: string;
  matchedString: string;
}

export class StorageAnalyzer {
  public analyzeLine(line: string, astNodes?: any): StorageMatch | null {
    // 1. LocalStorage / SessionStorage usage storing JWT tokens
    const localStorageRegex = /(localStorage|sessionStorage)\.setItem\(\s*["'`](jwt|token|access_token|id_token|refresh_token)["'`](?:\s*,)?/i;
    const storageMatch = localStorageRegex.exec(line);
    if (storageMatch) {
      return {
        issue: 'LocalStorageUsage',
        api: storageMatch[0],
        description: `Sensitive token saved in browser ${storageMatch[1]} storage, rendering it vulnerable to extraction via XSS (Cross-Site Scripting).`,
        matchedString: storageMatch[0]
      };
    }

    // 2. Cookie Security Misconfigurations
    // e.g. res.cookie('token', token, { ... }) without httpOnly: true or secure: true
    const cookieRegex = /res\.cookie\(\s*["'`](?:jwt|token|access_token)["'`](\s*,[^)]+)?\)/i;
    if (cookieRegex.test(line)) {
      const missingHttpOnly = !line.includes('httpOnly: true');
      const missingSecure = !line.includes('secure: true');
      const missingSameSite = !line.includes('sameSite:');

      if (missingHttpOnly || missingSecure || missingSameSite) {
        let details = 'Cookie storing JWT is missing security attributes: ';
        if (missingHttpOnly) details += 'HttpOnly (vulnerable to XSS leakage); ';
        if (missingSecure) details += 'Secure (sent over plaintext HTTP); ';
        if (missingSameSite) details += 'SameSite (vulnerable to CSRF). ';

        return {
          issue: 'CookieSecurityMisconfiguration',
          api: 'res.cookie',
          description: details.trim(),
          matchedString: line.trim()
        };
      }
    }

    return null;
  }
}
