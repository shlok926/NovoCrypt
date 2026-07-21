export interface KeyExchangeMatch {
  kexType: 'RSA-KEX' | 'ECDH' | 'ML-KEM' | 'Hybrid-KEM';
  api: string;
  description: string;
  matchedString: string;
}

export class KeyExchangeAnalyzer {
  public analyzeLine(line: string, astNodes?: any): KeyExchangeMatch | null {
    // 1. Hybrid KEM
    const hybridKex = /\b(x25519_mlkem768|x25519_kyber768|hybrid-kex|hybrid-kem)\b/i;
    const hybridMatch = hybridKex.exec(line);
    if (hybridMatch) {
      return {
        kexType: 'Hybrid-KEM',
        api: hybridMatch[0],
        description: `Post-quantum hybrid key encapsulation mechanism detected: "${hybridMatch[0]}".`,
        matchedString: hybridMatch[0]
      };
    }

    // 2. ML-KEM
    const mlkemKex = /\b(ml-kem-768|ml-kem-1024|ml-kem-512|kyber768|kyber1024)\b/i;
    const mlkemMatch = mlkemKex.exec(line);
    if (mlkemMatch) {
      return {
        kexType: 'ML-KEM',
        api: mlkemMatch[0],
        description: `Post-quantum ML-KEM key encapsulation mechanism detected: "${mlkemMatch[0]}".`,
        matchedString: mlkemMatch[0]
      };
    }

    // 3. RSA Key transport
    const rsaKex = /\b(RSA_KEX|RSA-KeyTransport|RSA-OAEP|RSA-PKCS1-1_5)\b/i;
    const rsaMatch = rsaKex.exec(line);
    if (rsaMatch) {
      return {
        kexType: 'RSA-KEX',
        api: rsaMatch[0],
        description: `Classical quantum-vulnerable RSA key transport / exchange detected: "${rsaMatch[0]}".`,
        matchedString: rsaMatch[0]
      };
    }

    // 4. ECDH key agreement
    const ecdhKex = /\b(ecdh|ecdhe|x25519|secp256r1|curve25519)\b/i;
    const ecdhMatch = ecdhKex.exec(line);
    if (ecdhMatch) {
      return {
        kexType: 'ECDH',
        api: ecdhMatch[0],
        description: `Classical quantum-vulnerable Elliptic Curve Diffie-Hellman (ECDH) key exchange detected: "${ecdhMatch[0]}".`,
        matchedString: ecdhMatch[0]
      };
    }

    return null;
  }
}
