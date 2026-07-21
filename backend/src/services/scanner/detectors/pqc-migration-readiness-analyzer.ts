import { MigrationStage } from './pqc-types';

export interface ScorePolicy {
  deprecatedClassical: number;
  hardcodedKeys: number;
  staticCrypto: number;
  missingInventory: number;
  legacyCertificates: number;
  nonAgileKeyExchange: number;
  nonAgileSignatures: number;
  unsupportedLibraries: number;
}

export interface ReadinessResult {
  score: number;
  stage: MigrationStage;
  roadmap: string[];
  recommendation: string;
}

export class MigrationReadinessAnalyzer {
  private defaultPolicy: ScorePolicy = {
    deprecatedClassical: 15,
    hardcodedKeys: 15,
    staticCrypto: 15,
    missingInventory: 10,
    legacyCertificates: 10,
    nonAgileKeyExchange: 15,
    nonAgileSignatures: 10,
    unsupportedLibraries: 10
  };

  // Vendor Profile Library
  private vendorGuidance: Record<string, string> = {
    'AWS KMS': 'AWS KMS supports hybrid post-quantum key agreement (ML-KEM/Kyber). Configure AWS SDK endpoints to use hybrid ciphers.',
    'Azure Key Vault': 'Azure Key Vault supports post-quantum certificate enrollment. Configure key templates for ML-DSA.',
    'Google Cloud KMS': 'GCloud KMS supports asymmetric ML-KEM/Kyber key creation. Enforce hybrid policies on decryption scopes.',
    'HashiCorp Vault': 'HashiCorp Vault PKI engine supports ML-DSA signing keys. Update token signing configuration to use post-quantum engines.'
  };

  public evaluateReadiness(
    indicators: {
      hasDeprecated: boolean;
      hasHardcodedKeys: boolean;
      hasStaticCrypto: boolean;
      hasMissingInventory: boolean;
      hasLegacyCerts: boolean;
      hasNonAgileKex: boolean;
      hasNonAgileSigs: boolean;
      hasUnsupportedLibs: boolean;
      detectedVendors: string[];
    },
    customPolicy?: ScorePolicy
  ): ReadinessResult {
    const policy = customPolicy || this.defaultPolicy;
    let score = 100;

    if (indicators.hasDeprecated) score -= policy.deprecatedClassical;
    if (indicators.hasHardcodedKeys) score -= policy.hardcodedKeys;
    if (indicators.hasStaticCrypto) score -= policy.staticCrypto;
    if (indicators.hasMissingInventory) score -= policy.missingInventory;
    if (indicators.hasLegacyCerts) score -= policy.legacyCertificates;
    if (indicators.hasNonAgileKex) score -= policy.nonAgileKeyExchange;
    if (indicators.hasNonAgileSigs) score -= policy.nonAgileSignatures;
    if (indicators.hasUnsupportedLibs) score -= policy.unsupportedLibraries;

    if (score < 0) score = 0;

    // Stage Classification
    let stage: MigrationStage = 'Legacy';
    if (score > 95) stage = 'PQC Ready';
    else if (score >= 81) stage = 'Hybrid';
    else if (score >= 61) stage = 'Migration';
    else if (score >= 41) stage = 'Pilot';
    else if (score >= 21) stage = 'Planning';

    // Structured Roadmap Template
    const roadmap: string[] = [];
    if (score < 40) {
      roadmap.push('Phase 1: Inventory — Formulate software cryptographic bill of materials (SBOM) and catalog asymmetric configurations.');
    }
    if (score < 60) {
      roadmap.push('Phase 2: Hybrid Deployment — Test hybrid key exchange (X25519 + ML-KEM) in developer staging environments.');
    }
    if (score < 80) {
      roadmap.push('Phase 3: Certificate Migration — Implement dual double-signed classical/PQC certificates for external endpoints.');
    }
    if (score < 95) {
      roadmap.push('Phase 4: PQC Default — Enforce FIPS 203 standardized ML-KEM and FIPS 204 ML-DSA parameters.');
    }
    roadmap.push('Phase 5: Legacy Removal — Periodically retire SHA-1, MD5, and RSA key transport mechanisms.');

    // Vendor guidance inclusion
    let recommendation = `Migration stage is: ${stage}. Score = ${score}/100. Recommendations: Configure dynamic factory interfaces.`;
    for (const vendor of indicators.detectedVendors) {
      if (this.vendorGuidance[vendor]) {
        recommendation += ` [Vendor Guidance - ${vendor}]: ${this.vendorGuidance[vendor]}`;
      }
    }

    return {
      score,
      stage,
      roadmap,
      recommendation
    };
  }
}
