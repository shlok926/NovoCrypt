export interface KeyGenMatch {
  api: string;
  library?: string;
  isWeakRandom: boolean;
  curveParam?: string;
  matchedString: string;
}

export class KeyGenerationAnalyzer {
  private patterns = [
    {
      regex: /(KeyPairGenerator\.getInstance\(\s*['"`](EC|ECDSA|ECDH)['"`]\)|KeyPairGeneratorSpi)/i,
      api: 'KeyPairGenerator.getInstance("EC")',
      library: 'Java Cryptography Architecture (JCA)'
    },
    {
      regex: /(crypto\.generateKeyPair(?:Sync)?\(\s*['"`]ec['"`])/i,
      api: 'crypto.generateKeyPair("ec")',
      library: 'Node.js Crypto'
    },
    {
      regex: /(ECDsa\.Create\(\s*(?:ECCurve|['"`]|$))/i,
      api: 'ECDsa.Create()',
      library: '.NET Cryptography'
    },
    {
      regex: /(ec\.generate_private_key\()/i,
      api: 'ec.generate_private_key()',
      library: 'Python Cryptography Library'
    },
    {
      regex: /(ecdsa\.GenerateKey\(\s*|elliptic\.GenerateKey\(\s*)/i,
      api: 'ecdsa.GenerateKey()',
      library: 'Go crypto/ecdsa'
    },
    {
      regex: /(EC_KEY_new_by_curve_name|EC_KEY_generate_key)/i,
      api: 'EC_KEY_generate_key()',
      library: 'OpenSSL C API'
    },
    {
      regex: /(crypto_sign_keypair|crypto_box_keypair|crypto_kx_keypair)/i,
      api: 'crypto_sign_keypair()',
      library: 'libsodium'
    },
    {
      regex: /(ECKeyPairGenerator)/i,
      api: 'ECKeyPairGenerator()',
      library: 'BouncyCastle'
    },
    {
      regex: /(Ed25519KeyPair::generate_pkcs8|agreement::EphemeralPrivateKey::generate)/i,
      api: 'Ed25519KeyPair::generate_pkcs8()',
      library: 'Rust ring'
    }
  ];

  public analyzeLine(line: string): KeyGenMatch | null {
    // Direct check for weak entropy source or PRNG seeding
    const weakSeedRegex = /(new\s+SecureRandom\s*\(\s*new\s+byte|new\s+SecureRandom\s*\(\s*seed|srand\s*\(|random\.seed\()/i;
    if (weakSeedRegex.test(line)) {
      return {
        api: 'Weak Entropy Initialization',
        library: 'Standard Cryptographic Provider',
        isWeakRandom: true,
        matchedString: line.trim()
      };
    }

    // 1. Audit keygen pattern
    for (const pattern of this.patterns) {
      const match = pattern.regex.exec(line);
      if (match) {
        // Check for weak entropy/static seeds indicators in the same line
        const isWeakRandom = 
          line.includes('new SecureRandom(new byte[]') || 
          line.includes('new SecureRandom(seed)') || 
          line.includes('srand(') || 
          line.includes('random.seed(') || 
          line.includes('new Random(') ||
          line.includes('math/rand'); // Go unsafe rand

        return {
          api: pattern.api,
          library: pattern.library,
          isWeakRandom,
          matchedString: match[0]
        };
      }
    }
    return null;
  }
}
