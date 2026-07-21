export type PqcAlgorithm = 'ML-KEM' | 'ML-DSA' | 'SLH-DSA' | 'RSA' | 'ECDSA' | 'ECDH' | 'Ed25519' | 'Ed448' | 'X25519' | 'X448' | 'DH' | 'Unknown';
export type SecurityCategory = 'Vulnerable' | 'Secure Classical' | 'Post-Quantum';
export type MigrationStage = 'Legacy' | 'Planning' | 'Pilot' | 'Migration' | 'Hybrid' | 'PQC Ready';
export type AgilityClassification = 'Static Crypto' | 'Semi-Agile' | 'Fully Crypto Agile';
export type HybridStatus = 'Experimental' | 'Pilot' | 'Production-Ready' | 'None';

export interface CryptoInventory {
  inventoryId: string;
  detectorVersion: string;
  generatedTimestamp: string;
  scanIdentifier: string;
  algorithms: string[];
  keys: Array<{ type: string; length?: number; agility: string; isHardcoded: boolean }>;
  certificates: Array<{ subject: string; signatureAlgorithm: string }>;
  protocols: string[];
  dependencies: string[];
  signatureAlgorithms: string[];
}

export interface PqcEvidence {
  algorithm: PqcAlgorithm;
  securityCategory: SecurityCategory;
  quantumRisk: string;
  migrationStage: MigrationStage;
  library?: string;
  language: string;
  deploymentContext: string;
  hybridStatus: HybridStatus;
  certificateType: string;
  keyExchange: string;
  signatureAlgorithm: string;
  readinessScore: number;
  recommendation: string;

  // Refined enterprise parameters
  migrationPriority: 'High' | 'Medium' | 'Low' | 'Informational';
  businessImpact: 'High' | 'Medium' | 'Low';
  deploymentCriticality: 'Production' | 'Staging' | 'Development';
  complianceMapping: string[];
  inventoryReferences: string[];
  cryptoAgilityClassification: AgilityClassification;
  inventoryIdentifier: string;
  migrationRoadmapReferences: string[];

  // Base evidence compatibility fields
  file: string;
  line: number;
  snippet: string;
  api: string;
  detectorVersion: string;
  evidenceQuality: number;
}
