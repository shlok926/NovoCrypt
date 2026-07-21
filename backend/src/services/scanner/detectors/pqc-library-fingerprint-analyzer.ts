export interface LibraryMatch {
  library: string;
  language: string;
  matchedString: string;
}

export class LibraryFingerprintAnalyzer {
  private patterns = [
    { regex: /liboqs|oqs|open-quantum-safe/i, library: 'liboqs', language: 'c/cpp' },
    { regex: /oqs-openssl|openssl.*oqs/i, library: 'OQS-OpenSSL', language: 'c/cpp' },
    { regex: /org\.bouncycastle/i, library: 'Bouncy Castle', language: 'java' },
    { regex: /aws-lc/i, library: 'AWS-LC', language: 'c/cpp' },
    { regex: /circl/i, library: 'CIRCL', language: 'go' },
    { regex: /pqclean/i, library: 'PQClean', language: 'c/cpp' },
    { regex: /pqcrypto/i, library: 'pqcrypto', language: 'rust/python' },
    { regex: /rustcrypto/i, library: 'RustCrypto', language: 'rust' },
    { regex: /golang\.org\/x\/crypto/i, library: 'Go x/crypto', language: 'go' },
    { regex: /openssl/i, library: 'OpenSSL', language: 'c/cpp' },
    { regex: /boringssl/i, library: 'BoringSSL', language: 'c/cpp' },
    { regex: /wolfssl/i, library: 'wolfSSL', language: 'c/cpp' },
    { regex: /botan/i, library: 'Botan', language: 'c/cpp' }
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
