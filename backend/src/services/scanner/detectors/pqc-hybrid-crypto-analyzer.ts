import { HybridStatus } from './pqc-types';
import { PQC_REGEX } from '../utils/regex';

export interface HybridMatch {
  hybridStatus: HybridStatus;
  api: string;
  description: string;
  matchedString: string;
}

export class HybridCryptoAnalyzer {
  public analyzeLine(line: string, astNodes?: any): HybridMatch | null {
    // Matches hybrid key exchanges: X25519_MLKEM768, x25519_kyber768, secp256r1_kyber768, hybridKex
    const hybridTlsRegex = PQC_REGEX.HYBRID_TLS;
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
    const compositeRegex = PQC_REGEX.COMPOSITE;
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
