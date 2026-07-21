export interface SignatureMatch {
  sigType: 'RSA' | 'ECDSA' | 'EdDSA' | 'ML-DSA' | 'SLH-DSA' | 'Hybrid-Signature';
  api: string;
  description: string;
  matchedString: string;
}

export class SignatureAnalyzer {
  public analyzeLine(line: string, astNodes?: any): SignatureMatch | null {
    // 1. Hybrid signatures
    const hybridSig = /\b(composite-signature|hybrid-signature|double-signature)\b/i;
    const hybridMatch = hybridSig.exec(line);
    if (hybridMatch) {
      return {
        sigType: 'Hybrid-Signature',
        api: hybridMatch[0],
        description: `Hybrid digital signature scheme detected: "${hybridMatch[0]}".`,
        matchedString: hybridMatch[0]
      };
    }

    // 2. ML-DSA
    const mldsaSig = /\b(ml-dsa-65|ml-dsa-87|ml-dsa-44|dilithium3|dilithium5)\b/i;
    const mldsaMatch = mldsaSig.exec(line);
    if (mldsaMatch) {
      return {
        sigType: 'ML-DSA',
        api: mldsaMatch[0],
        description: `NIST standardized post-quantum digital signature scheme ML-DSA detected: "${mldsaMatch[0]}".`,
        matchedString: mldsaMatch[0]
      };
    }

    // 3. SLH-DSA
    const slhdsaSig = /\b(slh-dsa-128f|slh-dsa-128s|sphincs\+)\b/i;
    const slhdsaMatch = slhdsaSig.exec(line);
    if (slhdsaMatch) {
      return {
        sigType: 'SLH-DSA',
        api: slhdsaMatch[0],
        description: `NIST standardized stateless hash-based digital signature scheme SLH-DSA detected: "${slhdsaMatch[0]}".`,
        matchedString: slhdsaMatch[0]
      };
    }

    // 4. EdDSA
    const eddsaSig = /\b(eddsa|ed25519|ed448)\b/i;
    const eddsaMatch = eddsaSig.exec(line);
    if (eddsaMatch) {
      return {
        sigType: 'EdDSA',
        api: eddsaMatch[0],
        description: `Classical EdDSA signature scheme detected: "${eddsaMatch[0]}".`,
        matchedString: eddsaMatch[0]
      };
    }

    // 5. ECDSA
    const ecdsaSig = /\b(ecdsa|secp256r1|secp384r1|sha256WithECDSA)\b/i;
    const ecdsaMatch = ecdsaSig.exec(line);
    if (ecdsaMatch) {
      return {
        sigType: 'ECDSA',
        api: ecdsaMatch[0],
        description: `Classical quantum-vulnerable ECDSA digital signature scheme detected: "${ecdsaMatch[0]}".`,
        matchedString: ecdsaMatch[0]
      };
    }

    // 6. RSA
    const rsaSig = /\b(RSA-SHA256|RSA-SHA512|sha256WithRSAEncryption)\b/i;
    const rsaMatch = rsaSig.exec(line);
    if (rsaMatch) {
      return {
        sigType: 'RSA',
        api: rsaMatch[0],
        description: `Classical quantum-vulnerable RSA digital signature scheme detected: "${rsaMatch[0]}".`,
        matchedString: rsaMatch[0]
      };
    }

    // 7. Context signature indicators
    const docSignMatch = /\b(documentSign|signPdf)\b/i.exec(line);
    if (docSignMatch) {
      return {
        sigType: 'RSA',
        api: docSignMatch[0],
        description: 'Classical document signing context detected.',
        matchedString: docSignMatch[0]
      };
    }

    return null;
  }
}
