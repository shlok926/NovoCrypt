export interface CertificateMatch {
  certType: 'RSA' | 'ECDSA' | 'ML-DSA' | 'Hybrid';
  api: string;
  description: string;
  matchedString: string;
}

export class CertificateAnalyzer {
  public analyzeLine(line: string, astNodes?: any): CertificateMatch | null {
    // 1. ML-DSA certificates
    // Matches e.g., signatureAlgorithm: 'ML-DSA-65', certAlgorithm: 'ml-dsa'
    const mldsaCert = /\b(ml-dsa|dilithium|slh-dsa|sphincs\+)[-_]?cert/i;
    const certMatch = mldsaCert.exec(line);
    if (certMatch) {
      return {
        certType: 'ML-DSA',
        api: certMatch[0],
        description: `Standardized post-quantum signature certificate type identified: "${certMatch[0]}".`,
        matchedString: certMatch[0]
      };
    }

    // 2. Hybrid certificates
    // Matches e.g., hybrid-cert, double-signed cert
    const hybridCert = /\b(hybrid[-_]cert|double[-_]signed[-_]cert)\b/i;
    const hybridMatch = hybridCert.exec(line);
    if (hybridMatch) {
      return {
        certType: 'Hybrid',
        api: hybridMatch[0],
        description: 'Hybrid double-signed (classical + post-quantum) certificate type detected.',
        matchedString: hybridMatch[0]
      };
    }

    // 3. Classical certificates
    const rsaCert = /\b(sha256WithRSAEncryption|sha1WithRSAEncryption|rsaEncryption)\b/i;
    const rsaMatch = rsaCert.exec(line);
    if (rsaMatch) {
      return {
        certType: 'RSA',
        api: rsaMatch[0],
        description: `Classical asymmetric RSA-signed certificate algorithm detected: "${rsaMatch[0]}".`,
        matchedString: rsaMatch[0]
      };
    }

    const ecdsaCert = /\b(ecdsa-with-SHA256|sha256WithECDSA)\b/i;
    const ecdsaMatch = ecdsaCert.exec(line);
    if (ecdsaMatch) {
      return {
        certType: 'ECDSA',
        api: ecdsaMatch[0],
        description: `Classical asymmetric ECDSA-signed certificate algorithm detected: "${ecdsaMatch[0]}".`,
        matchedString: ecdsaMatch[0]
      };
    }

    return null;
  }
}
