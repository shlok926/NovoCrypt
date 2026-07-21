export const PQC_REGEX = {
  // Matches hybrid TLS key exchange suites or composite names
  HYBRID_TLS: /(?:\b|_)(x25519_mlkem768|x25519_kyber768|secp256r1_kyber768|p256_kyber768|hybrid[-_]kem|hybridKex)(?:\b|_)/i,
  
  // Matches composite signature configurations
  COMPOSITE: /(?:\b|_)(composite|dual|hybrid)(?:\b|_).*(?:\b|_)(ml[-_]?kem|kyber|ml[-_]?dsa|dilithium)(?:\b|_)/i,
  
  // Matches safe standardized post-quantum algorithms
  SAFE_PQC: /['"`](ml-kem-768|ml-dsa-65|x25519_mlkem768)['"`]/i,
  
  // Matches Kyber/ML-KEM names and parameter sets
  ML_KEM: /(?:\b|_)(ml[-_]?kem|kyber)[-_]?(512|768|1024)(?:\b|_)/i,
  
  // Matches Dilithium/ML-DSA names and parameter sets
  ML_DSA: /(?:\b|_)(ml[-_]?dsa|dilithium)[-_]?(44|65|87|2|3|5)(?:\b|_)/i,
  
  // Matches SPHINCS+/SLH-DSA names
  SLH_DSA: /(?:\b|_)(slh[-_]?dsa|sphincs\+|sphincs[-_]plus)(?:\b|_)/i,
  
  // Matches agility-indicative classes and factories
  AGILE_FACTORY: /\b(CryptographicFactory|CryptoProviderRegistry|failoverProvider|pluggableKEM|algorithmProvider)\b/i,
  
  // Matches semi-agile environment lookups
  SEMI_AGILE: /(?:process\.env\.(?:CRYPTO_ALG|ALGORITHM|CIPHER)|config\.get\(['"`]algorithm['"`]\))/i,
  
  // Matches static JCA crypto engine instantiation
  STATIC_CRYPTO: /Cipher\.getInstance\(\s*['"`](AES|RSA|DES)/i
};
