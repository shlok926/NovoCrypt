export interface LibraryMatch {
  library: string;
  language: string;
  matchedString: string;
}

export class LibraryFingerprintAnalyzer {
  private patterns = [
    { regex: /require\(['"`]crypto['"`]\)|import.*from\s+['"`]crypto['"`]/i, library: 'Node crypto', language: 'javascript/typescript' },
    { regex: /window\.crypto\.subtle|crypto\.subtle/i, library: 'WebCrypto', language: 'javascript/typescript' },
    
    { regex: /import\s+javax\.crypto/i, library: 'Java JCE', language: 'java' },
    { regex: /import\s+org\.bouncycastle/i, library: 'Bouncy Castle', language: 'java' },

    { regex: /from\s+Crypto\.Cipher\s+import/i, library: 'PyCryptodome', language: 'python' },
    { regex: /from\s+cryptography\.hazmat/i, library: 'Python cryptography', language: 'python' },
    
    { regex: /"crypto\/aes"|"crypto\/cipher"/i, library: 'Go crypto/aes', language: 'go' },

    { regex: /use\s+ring::aead/i, library: 'Rust ring', language: 'rust' },
    { regex: /libsodium/i, library: 'libsodium', language: 'c/cpp' },
    { regex: /System\.Security\.Cryptography/i, library: 'Microsoft Cryptography', language: 'csharp' }
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
