export interface KeyExchangeMatch {
  api: string;
  library?: string;
  matchedString: string;
}

export class KeyExchangeAnalyzer {
  private patterns = [
    {
      regex: /(KeyAgreement\.getInstance\(\s*['"`]ECDH['"`]\))/i,
      api: 'KeyAgreement.getInstance("ECDH")',
      library: 'Java Cryptography Architecture (JCA)'
    },
    {
      regex: /(crypto\.createECDH\()/i,
      api: 'crypto.createECDH()',
      library: 'Node.js Crypto'
    },
    {
      regex: /(ec\.ECDH\(\))/i,
      api: 'ec.ECDH()',
      library: 'Python Cryptography Library'
    },
    {
      regex: /(curve25519\.X25519|crypto\/ecdh|ecdh\.NewCurve)/i,
      api: 'X25519 Key Agreement / ecdh',
      library: 'Go crypto/ecdh'
    },
    {
      regex: /(crypto_kx_client_session_keys|crypto_kx_server_session_keys)/i,
      api: 'libsodium kx API',
      library: 'libsodium'
    },
    {
      regex: /(EVP_PKEY_derive_init|EVP_PKEY_derive)/i,
      api: 'EVP_PKEY_derive()',
      library: 'OpenSSL C API'
    }
  ];

  public analyzeLine(line: string, astNodes?: any): KeyExchangeMatch | null {
    for (const pattern of this.patterns) {
      const match = pattern.regex.exec(line);
      if (match) {
        return {
          api: pattern.api,
          library: pattern.library,
          matchedString: match[0]
        };
      }
    }
    return null;
  }
}
