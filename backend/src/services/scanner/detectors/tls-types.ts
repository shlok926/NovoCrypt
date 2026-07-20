export interface TlsEvidence {
  subject: string;
  issuer: string;
  serialNumber: string;
  sha256Thumbprint: string;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  keySize: number;
  validityStart: string;
  validityEnd: string;
  subjectAlternativeNames: string[];
  hostname: string;
  sourceFileOrUrl: string;
  certificateDepth: number;
  chainLength: number;
  ocspPresence: boolean;
  crlPresence: boolean;
  alpn: string | null;
  tlsVersion: string | null;
  cipherSuite: string | null;
  handshakeDurationMs?: number;
  explanation?: string;
}

export interface TlsConfidenceResult {
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  score: number;
  reason: string;
}

export interface ParsedCertificate {
  subject: string;
  issuer: string;
  serialNumber: string;
  sha256Thumbprint: string;
  signatureAlgorithm: string;
  publicKeyAlgorithm: string;
  keySize: number;
  validityStart: Date;
  validityEnd: Date;
  subjectAlternativeNames: string[];
  ocspPresence: boolean;
  crlPresence: boolean;
  ocspUrls: string[];
  crlUrls: string[];
  pem: string;
  isCA: boolean;
  pathLenConstraint?: number;
  keyUsage: string[];
  extKeyUsage: string[];
}

export interface PerformanceBudget {
  handshakeTimeoutMs: number;
  maxChainLength: number;
  maxConcurrentConnections: number;
  maxCertificateSizeBytes: number;
  maxParseTimeMs: number;
  maxNetworkBudgetMs: number;
}

export const TLS_PERFORMANCE_BUDGET: PerformanceBudget = {
  handshakeTimeoutMs: 5000,
  maxChainLength: 10,
  maxConcurrentConnections: 5,
  maxCertificateSizeBytes: 1024 * 1024, // 1MB
  maxParseTimeMs: 200,
  maxNetworkBudgetMs: 15000,
};
