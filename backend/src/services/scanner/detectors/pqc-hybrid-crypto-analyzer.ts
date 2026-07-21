import { HybridStatus } from './pqc-types';

export interface HybridMatch {
  hybridStatus: HybridStatus;
  api: string;
  description: string;
  matchedString: string;
}

export class HybridCryptoAnalyzer {
  public analyzeLine(line: string, astNodes?: any): HybridMatch | null {
    // Matches hybrid key exchanges: X25519_MLKEM768, x25519_kyber768, secp256r1_kyber768, hybridKex
    const hybridTlsRegex = /(?:\b|_)(x25519_mlkem768|x25519_kyber768|secp256r1_kyber768|p256_kyber768|hybrid[-_]kem|hybridKex)(?:\b|_)/i;
    const hybridMatch = hybridTlsRegex.exec(line);
    if (hybridMatch) {
      return {
        hybridStatus: 'Production-Ready',
        api: hybridMatch[1],
        description: `Hybrid key exchange deployment detected: "${hybridMatch[1]}".`,
        matchedString: hybridMatch[0]
      };
    }

    // Combined indicators: ECDH + ML-KEM, RSA + Kyber, composite-signature
    const compositeRegex = /(?:\b|_)(composite|dual|hybrid)(?:\b|_).*(?:\b|_)(ml[-_]?kem|kyber|ml[-_]?dsa|dilithium)(?:\b|_)/i;
    const compositeMatch = compositeRegex.exec(line);
    if (compositeMatch) {
      return {
        hybridStatus: 'Pilot',
        api: compositeMatch[0],
        description: `Composite post-quantum signature or key exchange detected: "${compositeMatch[0]}".`,
        matchedString: compositeMatch[0]
      };
    }

    return null;
  }
}
