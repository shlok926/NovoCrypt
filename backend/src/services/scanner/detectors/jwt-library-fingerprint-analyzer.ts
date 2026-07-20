export interface LibraryMatch {
  library: string;
  language: string;
  matchedString: string;
}

export class LibraryFingerprintAnalyzer {
  private patterns = [
    { regex: /require\(['"`]jsonwebtoken['"`]\)|import.*from\s+['"`]jsonwebtoken['"`]/i, library: 'jsonwebtoken', language: 'javascript/typescript' },
    { regex: /require\(['"`]jose['"`]\)|import.*from\s+['"`]jose['"`]/i, library: 'jose', language: 'javascript/typescript' },
    { regex: /passport-jwt/i, library: 'passport-jwt', language: 'javascript/typescript' },
    
    { regex: /import\s+com\.nimbusds/i, library: 'Nimbus JOSE', language: 'java' },
    { regex: /import\s+io\.jsonwebtoken/i, library: 'jjwt', language: 'java' },
    { regex: /import\s+com\.auth0\.jwt/i, library: 'Auth0 Java JWT', language: 'java' },
    { regex: /org\.springframework\.security\.oauth2\.jwt/i, library: 'Spring Security', language: 'java' },
    { regex: /io\.quarkus\.oidc/i, library: 'Quarkus OIDC', language: 'java' },

    { regex: /import\s+jwt\b|from\s+jwt\s+import/i, library: 'PyJWT', language: 'python' },
    { regex: /import\s+jose\b|from\s+jose\s+import/i, library: 'python-jose', language: 'python' },
    
    { regex: /github\.com\/golang-jwt\/jwt|github\.com\/dgrijalva\/jwt-go/i, library: 'golang-jwt', language: 'go' },

    { regex: /Microsoft\.IdentityModel\.Tokens|System\.IdentityModel\.Tokens\.Jwt/i, library: 'Microsoft.IdentityModel', language: 'csharp' }
  ];

  public analyzeLine(line: string, astNodes?: any): LibraryMatch | null {
    for (const pattern of this.patterns) {
      const match = pattern.regex.exec(line);
      if (match) {
        return {
          library: pattern.library,
          language: pattern.language,
          matchedString: match[0]
        };
      }
    }
    return null;
  }
}
