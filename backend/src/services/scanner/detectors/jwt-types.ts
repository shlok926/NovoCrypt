export type TokenType = 'JWS' | 'JWE' | 'Nested JWT' | 'Malformed' | 'Unsecured';

export type SecretClassification = 
  | 'Hardcoded' 
  | 'Default' 
  | 'Weak' 
  | 'Test' 
  | 'Environment' 
  | 'Vault Managed';

export interface JwtEvidence {
  tokenType: TokenType;
  algorithm?: string;
  secretClassification?: SecretClassification;
  oidcProvider?: string;
  threatContext?: string;
  storageLocation?: string;
  claims?: string[];
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
