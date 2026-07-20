export interface SignatureMatch {
  api: string;
  library?: string;
  hashAlgorithm?: string;
  isWeakHash: boolean;
  isEd25519OrEd448: boolean;
  matchedString: string;
}

export class SignatureAnalyzer {
  private patterns = [
    {
      regex: /(Signature\.getInstance\(\s*['"`](\w+)withECDSA['"`]\))/i,
      api: 'Signature.getInstance()',
      library: 'Java Cryptography Architecture (JCA)',
      hashGroup: 2
    },
    {
      regex: /(\.SignData\(|\.SignHash\(|\.VerifyData\(|\.VerifyHash\()/i,
      api: 'ECDsa.SignData() / ECDsa.VerifyData()',
      library: '.NET Cryptography',
      hashGroup: null
    },
    {
      regex: /(ec\.ECDSA\(\s*hashes\.(\w+)\(\)\s*\))/i,
      api: 'ec.ECDSA()',
      library: 'Python Cryptography Library',
      hashGroup: 2
    },
    {
      regex: /(ecdsa\.Sign|ecdsa\.Verify|ed25519\.Sign|ed25519\.Verify)/i,
      api: 'ecdsa.Sign() / ed25519.Sign()',
      library: 'Go crypto/ecdsa'
    },
    {
      regex: /(crypto_sign_detached|crypto_sign_verify_detached)/i,
      api: 'crypto_sign_detached()',
      library: 'libsodium'
    },
    {
      regex: /(crypto\.sign\(\s*['"`](\w+)['"`]|crypto\.verify\(\s*['"`](\w+)['"`])/i,
      api: 'crypto.sign() / crypto.verify()',
      library: 'Node.js Crypto',
      hashGroup: 2
    }
  ];

  public analyzeLine(line: string): SignatureMatch | null {
    for (const pattern of this.patterns) {
      const match = pattern.regex.exec(line);
      if (match) {
        let hashAlgorithm = 'unknown';
        if (pattern.hashGroup && match[pattern.hashGroup]) {
          hashAlgorithm = match[pattern.hashGroup].toUpperCase();
        }
        
        // Scan for weak hash functions
        const isWeakHash = 
          hashAlgorithm.includes('SHA1') || 
          hashAlgorithm.includes('MD5') || 
          line.toLowerCase().includes('md5') || 
          line.toLowerCase().includes('sha1');
          
        const isEd25519OrEd448 = 
          line.toLowerCase().includes('ed25519') || 
          line.toLowerCase().includes('ed448') ||
          pattern.api.includes('ed25519');

        return {
          api: pattern.api,
          library: pattern.library,
          hashAlgorithm,
          isWeakHash,
          isEd25519OrEd448,
          matchedString: match[0]
        };
      }
    }
    return null;
  }
}
