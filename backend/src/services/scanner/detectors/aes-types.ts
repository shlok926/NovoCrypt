export type AesAlgorithm = 'AES-128' | 'AES-192' | 'AES-256' | 'Unknown';
export type AesMode = 'ECB' | 'CBC' | 'GCM' | 'CCM' | 'SIV' | 'CTR' | 'CFB' | 'OFB' | 'XTS' | 'EAX' | 'Unknown';
export type AesIVClassification = 'Static' | 'Zero' | 'Random' | 'None' | 'Predictable';
export type AesPadding = 'PKCS5' | 'PKCS7' | 'Zero' | 'None' | 'Unknown';
export type AesKdf = 'PBKDF2' | 'Argon2id' | 'scrypt' | 'HKDF' | 'None' | 'Weak';

export interface AesEvidence {
  algorithm: AesAlgorithm;
  mode: AesMode;
  keySize?: number;
  iv?: AesIVClassification;
  nonce?: string;
  padding?: AesPadding;
  kdf?: AesKdf;
  library?: string;
  language: string;
  usageContext: string;
  confidence: number;
  standardsReferences: string[];
  recommendation: string;
  
  // Base evidence compatibility fields
  file: string;
  line: number;
  snippet: string;
  api: string;
  detectorVersion: string;
  evidenceQuality: number;
}
