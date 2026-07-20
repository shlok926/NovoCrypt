export type EccSecurityClassification = 'Weak' | 'Deprecated' | 'Secure Classical';

export interface CurveDetails {
  name: string;
  oid?: string;
  keySize: number;
  classification: EccSecurityClassification;
  recommendedStatus: string;
}

export interface EccEvidence {
  curveName?: string;
  oid?: string;
  algorithm: string;
  purpose: string;
  usageContext?: string;
  keySize?: number;
  securityClassification: EccSecurityClassification;
  language: string;
  api: string;
  library?: string;
  file: string;
  line: number;
  snippet: string;
  detectorVersion: string;
  evidenceQuality: number;
  confidence: number;
  recommendation: string;
  standardsReferences?: string[];
}

export const curveMetadata: Record<string, CurveDetails> = {
  'secp112r1': { name: 'secp112r1', oid: '1.3.132.0.6', keySize: 112, classification: 'Weak', recommendedStatus: 'Not recommended (ECDLP vulnerable)' },
  'secp128r1': { name: 'secp128r1', oid: '1.3.132.0.8', keySize: 128, classification: 'Weak', recommendedStatus: 'Not recommended (ECDLP vulnerable)' },
  'secp160r1': { name: 'secp160r1', oid: '1.3.132.0.9', keySize: 160, classification: 'Weak', recommendedStatus: 'Not recommended (ECDLP vulnerable)' },
  'secp192k1': { name: 'secp192k1', oid: '1.3.132.0.31', keySize: 192, classification: 'Weak', recommendedStatus: 'Not recommended (ECDLP vulnerable)' },
  'secp192r1': { name: 'secp192r1', oid: '1.2.840.10045.3.1.1', keySize: 192, classification: 'Weak', recommendedStatus: 'Not recommended (ECDLP vulnerable)' },
  'secp224k1': { name: 'secp224k1', oid: '1.3.132.0.32', keySize: 224, classification: 'Weak', recommendedStatus: 'Not recommended (ECDLP vulnerable)' },
  'nistp192': { name: 'NIST P-192', oid: '1.2.840.10045.3.1.1', keySize: 192, classification: 'Weak', recommendedStatus: 'Deprecated (low security margin)' },
  'nistp224': { name: 'NIST P-224', oid: '1.2.840.10045.3.1.2', keySize: 224, classification: 'Weak', recommendedStatus: 'Deprecated (low security margin)' },
  
  'secp256k1': { name: 'secp256k1', oid: '1.3.132.0.10', keySize: 256, classification: 'Deprecated', recommendedStatus: 'Legacy (deprecated for enterprise PKI/TLS, lower safety margins)' },
  
  'nistp256': { name: 'NIST P-256', oid: '1.2.840.10045.3.1.7', keySize: 256, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'nistp384': { name: 'NIST P-384', oid: '1.3.132.0.34', keySize: 384, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'nistp521': { name: 'NIST P-521', oid: '1.3.132.0.35', keySize: 521, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  
  'curve25519': { name: 'Curve25519', oid: '1.3.101.110', keySize: 256, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'x25519': { name: 'X25519', oid: '1.3.101.110', keySize: 256, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'ed25519': { name: 'Ed25519', oid: '1.3.101.112', keySize: 256, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'curve448': { name: 'Curve448', oid: '1.3.101.111', keySize: 448, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'ed448': { name: 'Ed448', oid: '1.3.101.113', keySize: 448, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'x448': { name: 'X448', oid: '1.3.101.111', keySize: 448, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  
  'brainpoolp256r1': { name: 'Brainpool P256r1', oid: '1.3.36.3.3.2.8.1.1.7', keySize: 256, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'brainpoolp384r1': { name: 'Brainpool P384r1', oid: '1.3.36.3.3.2.8.1.1.11', keySize: 384, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' },
  'brainpoolp512r1': { name: 'Brainpool P512r1', oid: '1.3.36.3.3.2.8.1.1.13', keySize: 512, classification: 'Secure Classical', recommendedStatus: 'Recommended classically (Quantum migration required)' }
};
