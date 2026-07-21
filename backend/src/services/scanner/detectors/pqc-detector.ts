import { ScanContext, ScanFinding, TargetType, DetectorMetadata, Evidence, Rule } from '../types';
import { BaseDetector } from '../framework/BaseDetector';
import { ClassicalCryptoAnalyzer } from './pqc-classical-crypto-analyzer';
import { PqcAlgorithmAnalyzer } from './pqc-algorithm-analyzer';
import { HybridCryptoAnalyzer } from './pqc-hybrid-crypto-analyzer';
import { CryptoAgilityAnalyzer } from './pqc-agility-analyzer';
import { CryptoInventoryAnalyzer } from './pqc-inventory-analyzer';
import { MigrationReadinessAnalyzer } from './pqc-migration-readiness-analyzer';
import { CertificateAnalyzer } from './pqc-certificate-analyzer';
import { KeyExchangeAnalyzer } from './pqc-key-exchange-analyzer';
import { SignatureAnalyzer } from './pqc-signature-analyzer';
import { ProtocolAnalyzer } from './pqc-protocol-analyzer';
import { LibraryFingerprintAnalyzer } from './pqc-library-fingerprint-analyzer';
import { BestPracticesAnalyzer } from './pqc-best-practices-analyzer';
import { pqcRules } from './pqc-rule-catalog';
import { PqcEvidence, PqcAlgorithm, SecurityCategory, MigrationStage, AgilityClassification, HybridStatus } from './pqc-types';
import { TelemetryService } from '../../observability';

export class PqcDetector extends BaseDetector {
  id = 'detector-pqc';
  name = 'Post-Quantum Cryptography (PQC) Security Analyzer';
  version = '1.0.0';
  category = 'Cryptography';
  supportedLanguages = ['javascript', 'typescript', 'python', 'java', 'go', 'csharp', 'rust', 'c', 'cpp'];
  supportedExtensions = ['.js', '.ts', '.py', '.java', '.go', '.cs', '.rs', '.c', '.cpp', '.h', '.json', '.yaml', '.yml'];

  metadata: DetectorMetadata = {
    version: '1.0.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v1',
    category: 'Cryptography',
    documentationUrl: 'https://docs.novocrypt.app/detectors/pqc',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions
  };

  capabilities = {
    id: 'pqc-security',
    version: '1.0.0',
    category: ['Cryptography', 'Post-Quantum'],
    supportsAST: true,
    supportsCrossFileCorrelation: true,
    supportsTelemetry: true
  };

  supportedTargets: TargetType[] = ['code', 'config'];

  private classicalAnalyzer = new ClassicalCryptoAnalyzer();
  private pqcAlgoAnalyzer = new PqcAlgorithmAnalyzer();
  private hybridAnalyzer = new HybridCryptoAnalyzer();
  private agilityAnalyzer = new CryptoAgilityAnalyzer();
  private inventoryAnalyzer = new CryptoInventoryAnalyzer();
  private readinessAnalyzer = new MigrationReadinessAnalyzer();
  private certificateAnalyzer = new CertificateAnalyzer();
  private keyExchangeAnalyzer = new KeyExchangeAnalyzer();
  private signatureAnalyzer = new SignatureAnalyzer();
  private protocolAnalyzer = new ProtocolAnalyzer();
  private libraryAnalyzer = new LibraryFingerprintAnalyzer();
  private bestPracticesAnalyzer = new BestPracticesAnalyzer();

  // Cross-file correlation cache for classical crypto
  private static globalClassical = new Map<string, { file: string; line: number; alg: string }>();

  protected async executeDetection(context: ScanContext): Promise<ScanFinding[]> {
    const findings: ScanFinding[] = [];
    const sourceFile = context.fileName || 'unknown_file';

    if ((context.targetType === 'code' || context.targetType === 'config') && typeof context.target === 'string') {
      const start = performance.now();
      const targetCode = context.target;

      // --- Performance Budget Checks ---
      // 1. Target code size limit: 100 KB
      if (targetCode.length > 100 * 1024) {
        TelemetryService.recordCounter('pqc.scan.skipped.size', 1);
        return [];
      }

      const lines = targetCode.split('\n');
      const fileLibrary = this.libraryAnalyzer.analyzeLine(targetCode);
      const libraryName = fileLibrary ? fileLibrary.library : 'OpenSSL';
      const languageName = fileLibrary ? fileLibrary.language : (context.language || 'unknown');

      // Deployment context classification
      let deploymentContext = 'API Payload Encryption';
      if (/db|database|query|sql|prisma|collection/i.test(targetCode)) {
        deploymentContext = 'Database Encryption';
      } else if (/file|fs\.write|fs\.read|path|filename|filepath/i.test(targetCode)) {
        deploymentContext = 'File Encryption';
      } else if (/tls|socket|https|connect|handshake/i.test(targetCode)) {
        deploymentContext = 'TLS Record Layer';
      } else if (/ssh|ssh-rsa|ssh-dss/i.test(targetCode)) {
        deploymentContext = 'SSH Key Exchange';
      } else if (/storage|localStorage|sessionStorage|keychain|securestore/i.test(targetCode)) {
        deploymentContext = 'Mobile Storage';
      } else if (/kms|vault|aws|gcp|azure|hsm/i.test(targetCode)) {
        deploymentContext = 'Cloud KMS';
      } else if (/secret|credential|config|settings/i.test(targetCode)) {
        deploymentContext = 'Secrets Management';
      }

      // Collect lists for inventory generation
      const inventoryAlgs: string[] = [];
      const inventoryProtocols: string[] = [];
      const inventoryDeps: string[] = [];
      const inventorySigs: string[] = [];

      let hasDeprecated = false;
      let hasHardcodedKeys = false;
      let hasStaticCrypto = false;
      let hasLegacyCerts = false;
      let hasNonAgileKex = false;
      let hasNonAgileSigs = false;
      let hasUnsupportedLibs = false;
      const detectedVendors: string[] = [];

      // Detect vendors for profile logic
      if (/aws/i.test(targetCode)) detectedVendors.push('AWS KMS');
      if (/azure/i.test(targetCode)) detectedVendors.push('Azure Key Vault');
      if (/google|gcp/i.test(targetCode)) detectedVendors.push('Google Cloud KMS');
      if (/vault/i.test(targetCode)) detectedVendors.push('HashiCorp Vault');

      // Static Cache Cross-File Correlation
      let correlatedClassical = false;
      let classicalSources: string[] = [];
      for (const [file, details] of PqcDetector.globalClassical.entries()) {
        if (file !== sourceFile) {
          correlatedClassical = true;
          classicalSources.push(`${file}:${details.line}`);
        }
      }
      const correlationSuffix = classicalSources.length > 0
        ? ` (Correlated with classical algorithm definition in ${classicalSources.join(', ')})`
        : '';

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) return;

        // Ast compatibility mock
        const astMock = undefined;

        // 2. Performance limit: check statement length
        if (trimmedLine.length > 8192) return;

        // Run sub-analyzers
        const classical = this.classicalAnalyzer.analyzeLine(trimmedLine, astMock);
        const pqcAlg = this.pqcAlgoAnalyzer.analyzeLine(trimmedLine, astMock);
        const hybrid = this.hybridAnalyzer.analyzeLine(trimmedLine, astMock);
        const agility = this.agilityAnalyzer.analyzeLine(trimmedLine, astMock);
        const cert = this.certificateAnalyzer.analyzeLine(trimmedLine, astMock);
        const kex = this.keyExchangeAnalyzer.analyzeLine(trimmedLine, astMock);
        const sig = this.signatureAnalyzer.analyzeLine(trimmedLine, astMock);
        const proto = this.protocolAnalyzer.analyzeLine(trimmedLine, astMock);
        const bestPractice = this.bestPracticesAnalyzer.analyzeLine(trimmedLine, astMock);

        // Standard references
        const standards = ['FIPS 203', 'FIPS 204', 'NIST IR 8547'];

        // Populate inventory collections
        if (classical) inventoryAlgs.push(classical.algorithm);
        if (pqcAlg) inventoryAlgs.push(pqcAlg.parameterSet);
        if (proto) inventoryProtocols.push(proto.protocol);
        if (fileLibrary) inventoryDeps.push(fileLibrary.library);
        if (sig) inventorySigs.push(sig.sigType);

        // Process Classical Crypto Vulnerabilities
        if (classical) {
          if (classical.isDeprecated || /(md5|sha1|des)\b/i.test(trimmedLine)) {
            hasDeprecated = true;
            TelemetryService.recordCounter('pqc.legacy.algorithms', 1);
            findings.push(
              this.buildPqcFinding(pqcRules.PQC005, {
                algorithm: 'Unknown',
                securityCategory: 'Vulnerable',
                quantumRisk: 'Deprecated algorithms are vulnerable to classical cryptanalysis today.',
                migrationStage: 'Legacy',
                language: languageName,
                library: libraryName,
                deploymentContext,
                hybridStatus: 'None',
                certificateType: 'Classical',
                keyExchange: 'Unknown',
                signatureAlgorithm: 'Unknown',
                readinessScore: 30,
                recommendation: 'Migrate deprecated classical ciphers to secure standards immediately.',
                migrationPriority: 'High',
                businessImpact: 'High',
                deploymentCriticality: 'Production',
                complianceMapping: ['NIST SP 800-131A', 'OWASP ASVS'],
                inventoryReferences: [],
                cryptoAgilityClassification: 'Static Crypto',
                inventoryIdentifier: 'unknown',
                migrationRoadmapReferences: [],
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                api: classical.api,
                detectorVersion: this.version,
                evidenceQuality: 95
              })
            );
          } else {
            // Standard classical algorithm warnings (RSA, ECDH)
            let rule = pqcRules.PQC001; // RSA
            let kexType = 'RSA-KEX';
            let priority: 'High' | 'Medium' | 'Low' | 'Informational' = 'High';

            if (classical.algorithm === 'ECDH') {
              rule = pqcRules.PQC002;
              kexType = 'ECDH';
            } else if (classical.algorithm === 'ECDSA') {
              rule = pqcRules.PQC003;
              kexType = 'ECDSA';
              priority = 'Medium';
            } else if (classical.algorithm === 'X25519' || classical.algorithm === 'Ed25519') {
              rule = pqcRules.PQC003;
              kexType = classical.algorithm;
              priority = 'Medium';
            }

            // Context-Aware Severity matching
            if (trimmedLine.includes('documentSign') || trimmedLine.includes('signPdf')) {
              priority = 'Medium';
              rule.severity = 'medium';
            } else if (trimmedLine.includes('hybridKex') || correlatedClassical) {
              priority = 'Informational';
              rule.severity = 'info';
            }

            // Check hardcoded keys
            if (/(?:key|secret)\s*=\s*["'`][^"'`]{8,256}["'`]/i.test(trimmedLine)) {
              hasHardcodedKeys = true;
              findings.push(
                this.buildPqcFinding(pqcRules.PQC012, {
                  algorithm: classical.algorithm,
                  securityCategory: 'Vulnerable',
                  quantumRisk: 'Hardcoded keys compromise post-quantum confidentiality.',
                  migrationStage: 'Legacy',
                  language: languageName,
                  library: libraryName,
                  deploymentContext,
                  hybridStatus: 'None',
                  certificateType: 'Classical',
                  keyExchange: kexType,
                  signatureAlgorithm: 'Unknown',
                  readinessScore: 20,
                  recommendation: 'Externalize key config parameters to environment or KMS.',
                  migrationPriority: 'High',
                  businessImpact: 'High',
                  deploymentCriticality: 'Production',
                  complianceMapping: ['OWASP ASVS', 'OWASP Cheat Sheet'],
                  inventoryReferences: [],
                  cryptoAgilityClassification: 'Static Crypto',
                  inventoryIdentifier: 'unknown',
                  migrationRoadmapReferences: [],
                  file: sourceFile,
                  line: lineNum,
                  snippet: trimmedLine.substring(0, 200),
                  api: classical.api,
                  detectorVersion: this.version,
                  evidenceQuality: 95
                })
              );
            }

            // Cache in global classical map
            PqcDetector.globalClassical.set(sourceFile, {
              file: sourceFile,
              line: lineNum,
              alg: classical.algorithm
            });

            TelemetryService.recordCounter('pqc.classical.detected', 1);
            findings.push(
              this.buildPqcFinding(rule, {
                algorithm: classical.algorithm,
                securityCategory: 'Vulnerable',
                quantumRisk: rule.quantumRisk || 'Vulnerable to Shor\'s algorithm.',
                migrationStage: 'Planning',
                language: languageName,
                library: libraryName,
                deploymentContext,
                hybridStatus: 'None',
                certificateType: 'Classical',
                keyExchange: kexType,
                signatureAlgorithm: 'Unknown',
                readinessScore: 40,
                recommendation: rule.recommendation + correlationSuffix,
                migrationPriority: priority,
                businessImpact: 'High',
                deploymentCriticality: 'Production',
                complianceMapping: ['NIST SP 1800-38', 'NIST SP 800-57'],
                inventoryReferences: [],
                cryptoAgilityClassification: 'Static Crypto',
                inventoryIdentifier: 'unknown',
                migrationRoadmapReferences: [],
                file: sourceFile,
                line: lineNum,
                snippet: trimmedLine.substring(0, 200),
                api: classical.api,
                detectorVersion: this.version,
                evidenceQuality: 95
              })
            );
          }
        }

        // Process PQC Standardized algorithms detection
        if (pqcAlg) {
          let rule = pqcRules.PQC014; // ML-KEM
          let category: SecurityCategory = 'Post-Quantum';
          if (pqcAlg.algorithm === 'ML-KEM') {
            TelemetryService.recordCounter('pqc.mlkem.detected', 1);
            rule = pqcRules.PQC014;
          } else if (pqcAlg.algorithm === 'ML-DSA') {
            TelemetryService.recordCounter('pqc.mldsa.detected', 1);
            rule = pqcRules.PQC015;
          } else if (pqcAlg.algorithm === 'SLH-DSA') {
            rule = pqcRules.PQC016;
          }

          findings.push(
            this.buildPqcFinding(rule, {
              algorithm: pqcAlg.algorithm,
              securityCategory: category,
              quantumRisk: 'None. Standardized post-quantum algorithm.',
              migrationStage: 'PQC Ready',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: 'Production-Ready',
              certificateType: 'ML-DSA',
              keyExchange: pqcAlg.algorithm === 'ML-KEM' ? pqcAlg.parameterSet : 'Unknown',
              signatureAlgorithm: pqcAlg.algorithm !== 'ML-KEM' ? pqcAlg.parameterSet : 'Unknown',
              readinessScore: 100,
              recommendation: 'ML-KEM/ML-DSA algorithm detected in code. Keep updated with current standard profiles.',
              migrationPriority: 'Informational',
              businessImpact: 'Low',
              deploymentCriticality: 'Production',
              complianceMapping: [rule.references?.[0] || 'FIPS 203'],
              inventoryReferences: [],
              cryptoAgilityClassification: 'Fully Crypto Agile',
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: pqcAlg.api,
              detectorVersion: this.version,
              evidenceQuality: 98
            })
          );
        }

        // Process Hybrid deployments
        if (hybrid) {
          TelemetryService.recordCounter('pqc.hybrid.detected', 1);
          findings.push(
            this.buildPqcFinding(pqcRules.PQC013, {
              algorithm: 'ML-KEM',
              securityCategory: 'Post-Quantum',
              quantumRisk: 'None. Hybrid model protects against quantum interception.',
              migrationStage: 'Hybrid',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: hybrid.hybridStatus,
              certificateType: 'Hybrid',
              keyExchange: hybrid.api,
              signatureAlgorithm: 'Unknown',
              readinessScore: 90,
              recommendation: hybrid.description,
              migrationPriority: 'Informational',
              businessImpact: 'Low',
              deploymentCriticality: 'Production',
              complianceMapping: ['RFC 9370', 'ETSI PQC Migration Guidance'],
              inventoryReferences: [],
              cryptoAgilityClassification: 'Fully Crypto Agile',
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: hybrid.api,
              detectorVersion: this.version,
              evidenceQuality: 98
            })
          );
        }

        // Process Agility Match
        if (agility) {
          if (agility.classification === 'Static Crypto') hasStaticCrypto = true;
          let rule = pqcRules.PQC011; // Missing agility
          if (agility.classification === 'Fully Crypto Agile') rule = pqcRules.PQCB001;

          findings.push(
            this.buildPqcFinding(rule, {
              algorithm: 'Unknown',
              securityCategory: 'Secure Classical',
              quantumRisk: 'Static configurations restrict dynamic algorithm switches.',
              migrationStage: agility.classification === 'Fully Crypto Agile' ? 'Hybrid' : 'Planning',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: 'None',
              certificateType: 'Classical',
              keyExchange: 'Unknown',
              signatureAlgorithm: 'Unknown',
              readinessScore: agility.classification === 'Fully Crypto Agile' ? 85 : 45,
              recommendation: agility.description,
              migrationPriority: agility.classification === 'Fully Crypto Agile' ? 'Informational' : 'Medium',
              businessImpact: 'Medium',
              deploymentCriticality: 'Production',
              complianceMapping: ['NIST IR 8547', 'ETSI PQC Migration Guidance'],
              inventoryReferences: [],
              cryptoAgilityClassification: agility.classification,
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: agility.api,
              detectorVersion: this.version,
              evidenceQuality: 90
            })
          );
        }

        // Process Certificate check
        if (cert) {
          if (cert.certType === 'RSA' || cert.certType === 'ECDSA') hasLegacyCerts = true;
          let rule = pqcRules.PQC008; // Legacy cert
          if (cert.certType === 'ML-DSA' || cert.certType === 'Hybrid') rule = pqcRules.PQCB001;

          findings.push(
            this.buildPqcFinding(rule, {
              algorithm: 'Unknown',
              securityCategory: cert.certType === 'ML-DSA' ? 'Post-Quantum' : 'Vulnerable',
              quantumRisk: 'Classical certs are vulnerable to forging.',
              migrationStage: cert.certType === 'ML-DSA' ? 'PQC Ready' : 'Planning',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: cert.certType === 'Hybrid' ? 'Pilot' : 'None',
              certificateType: cert.certType,
              keyExchange: 'Unknown',
              signatureAlgorithm: 'Unknown',
              readinessScore: cert.certType === 'ML-DSA' ? 100 : 50,
              recommendation: cert.description,
              migrationPriority: cert.certType === 'ML-DSA' ? 'Informational' : 'Medium',
              businessImpact: 'High',
              deploymentCriticality: 'Production',
              complianceMapping: ['RFC 9370', 'ETSI PQC Migration Guidance'],
              inventoryReferences: [],
              cryptoAgilityClassification: 'Static Crypto',
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: cert.api,
              detectorVersion: this.version,
              evidenceQuality: 95
            })
          );
        }

        // Process Key Exchange check
        if (kex) {
          let rule = pqcRules.PQC002; // ECDH
          let cat: SecurityCategory = 'Vulnerable';
          let priority: 'High' | 'Medium' | 'Low' | 'Informational' = 'High';

          if (kex.kexType === 'RSA-KEX') {
            rule = pqcRules.PQC001;
          } else if (kex.kexType === 'ML-KEM') {
            rule = pqcRules.PQC014;
            cat = 'Post-Quantum';
            priority = 'Informational';
          } else if (kex.kexType === 'Hybrid-KEM') {
            rule = pqcRules.PQC013;
            cat = 'Post-Quantum';
            priority = 'Informational';
          } else {
            hasNonAgileKex = true;
          }

          findings.push(
            this.buildPqcFinding(rule, {
              algorithm: kex.kexType === 'ML-KEM' ? 'ML-KEM' : 'Unknown',
              securityCategory: cat,
              quantumRisk: 'Classical key exchanges lack protection on CRQCs.',
              migrationStage: cat === 'Post-Quantum' ? 'PQC Ready' : 'Planning',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: kex.kexType === 'Hybrid-KEM' ? 'Production-Ready' : 'None',
              certificateType: 'Classical',
              keyExchange: kex.kexType,
              signatureAlgorithm: 'Unknown',
              readinessScore: cat === 'Post-Quantum' ? 95 : 40,
              recommendation: kex.description,
              migrationPriority: priority,
              businessImpact: 'High',
              deploymentCriticality: 'Production',
              complianceMapping: ['NIST SP 1800-38', 'RFC 9370'],
              inventoryReferences: [],
              cryptoAgilityClassification: 'Static Crypto',
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: kex.api,
              detectorVersion: this.version,
              evidenceQuality: 95
            })
          );
        }

        // Process Signature check
        if (sig) {
          let rule = pqcRules.PQC003; // Classical signatures
          let cat: SecurityCategory = 'Vulnerable';
          let priority: 'High' | 'Medium' | 'Low' | 'Informational' = 'Medium';

          if (sig.sigType === 'ML-DSA') {
            rule = pqcRules.PQC015;
            cat = 'Post-Quantum';
            priority = 'Informational';
          } else if (sig.sigType === 'SLH-DSA') {
            rule = pqcRules.PQC016;
            cat = 'Post-Quantum';
            priority = 'Informational';
          } else if (sig.sigType === 'Hybrid-Signature') {
            rule = pqcRules.PQC013;
            cat = 'Post-Quantum';
            priority = 'Informational';
          } else if (sig.sigType === 'EdDSA') {
            cat = 'Secure Classical';
            priority = 'Medium';
          } else {
            hasNonAgileSigs = true;
          }

          // Context-aware checking
          if ((sig.sigType === 'RSA' || sig.sigType === 'ECDSA') && (trimmedLine.includes('documentSign') || trimmedLine.includes('signPdf'))) {
            priority = 'Medium';
            rule.severity = 'medium';
          }

          findings.push(
            this.buildPqcFinding(rule, {
              algorithm: sig.sigType === 'ML-DSA' ? 'ML-DSA' : (sig.sigType === 'SLH-DSA' ? 'SLH-DSA' : 'Unknown'),
              securityCategory: cat,
              quantumRisk: 'Classical digital signatures lack post-quantum authenticity.',
              migrationStage: cat === 'Post-Quantum' ? 'PQC Ready' : 'Planning',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: sig.sigType === 'Hybrid-Signature' ? 'Production-Ready' : 'None',
              certificateType: 'Classical',
              keyExchange: 'Unknown',
              signatureAlgorithm: sig.sigType,
              readinessScore: cat === 'Post-Quantum' ? 95 : 45,
              recommendation: sig.description,
              migrationPriority: priority,
              businessImpact: 'High',
              deploymentCriticality: 'Production',
              complianceMapping: ['FIPS 204', 'FIPS 205'],
              inventoryReferences: [],
              cryptoAgilityClassification: 'Static Crypto',
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: sig.api,
              detectorVersion: this.version,
              evidenceQuality: 95
            })
          );
        }

        // Process Protocol layer check
        if (proto) {
          let rule = pqcRules.PQCB001; // best practice default
          let priority: 'High' | 'Medium' | 'Low' | 'Informational' = 'Informational';
          if (proto.protocol === 'TLS' && (proto.api.includes('1_2') || proto.api.includes('1.2'))) {
            rule = pqcRules.PQC006;
            priority = 'Medium';
          } else if (proto.protocol === 'SSH' && proto.api.includes('rsa')) {
            rule = pqcRules.PQC006;
            priority = 'Medium';
          }

          findings.push(
            this.buildPqcFinding(rule, {
              algorithm: 'Unknown',
              securityCategory: 'Secure Classical',
              quantumRisk: 'Protocols without hybrid negotiation lack retrospective protection.',
              migrationStage: 'Planning',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: 'None',
              certificateType: 'Classical',
              keyExchange: 'Unknown',
              signatureAlgorithm: 'Unknown',
              readinessScore: 70,
              recommendation: proto.description,
              migrationPriority: priority,
              businessImpact: 'Medium',
              deploymentCriticality: 'Production',
              complianceMapping: ['RFC 9370', 'ETSI PQC Migration Guidance'],
              inventoryReferences: [],
              cryptoAgilityClassification: 'Static Crypto',
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: proto.api,
              detectorVersion: this.version,
              evidenceQuality: 95,
              protocol: proto.protocol // Add protocol to evidence context
            } as any)
          );
        }

        // Process Best practices configuration check
        if (bestPractice) {
          findings.push(
            this.buildPqcFinding(pqcRules.PQCB001, {
              algorithm: 'Unknown',
              securityCategory: 'Post-Quantum',
              quantumRisk: 'None.',
              migrationStage: 'PQC Ready',
              language: languageName,
              library: libraryName,
              deploymentContext,
              hybridStatus: 'Production-Ready',
              certificateType: 'Classical',
              keyExchange: 'Unknown',
              signatureAlgorithm: 'Unknown',
              readinessScore: 100,
              recommendation: bestPractice.description,
              migrationPriority: 'Informational',
              businessImpact: 'Low',
              deploymentCriticality: 'Production',
              complianceMapping: ['FIPS 203', 'FIPS 204'],
              inventoryReferences: [],
              cryptoAgilityClassification: 'Fully Crypto Agile',
              inventoryIdentifier: 'unknown',
              migrationRoadmapReferences: [],
              file: sourceFile,
              line: lineNum,
              snippet: trimmedLine.substring(0, 200),
              api: bestPractice.practice,
              detectorVersion: this.version,
              evidenceQuality: 98
            })
          );
        }
      });

      // Execute migration readiness score evaluation
      const readiness = this.readinessAnalyzer.evaluateReadiness({
        hasDeprecated,
        hasHardcodedKeys,
        hasStaticCrypto,
        hasMissingInventory: inventoryAlgs.length === 0,
        hasLegacyCerts,
        hasNonAgileKex,
        hasNonAgileSigs,
        hasUnsupportedLibs,
        detectedVendors
      });

      TelemetryService.recordHistogram('pqc.migration.score', readiness.score);
      TelemetryService.recordCounter('pqc.inventory.generated', 1);

      // Generate Cryptographic Inventory SBOM object
      const inventory = this.inventoryAnalyzer.generateInventory(
        sourceFile,
        inventoryAlgs,
        inventoryProtocols,
        inventoryDeps,
        inventorySigs
      );

      // If migration score is weak, add a PQC010 finding
      if (readiness.score < 60) {
        findings.push(
          this.buildPqcFinding(pqcRules.PQC010, {
            algorithm: 'Unknown',
            securityCategory: 'Vulnerable',
            quantumRisk: 'Low score reflects multiple static, vulnerable algorithms.',
            migrationStage: readiness.stage,
            language: languageName,
            library: libraryName,
            deploymentContext,
            hybridStatus: 'None',
            certificateType: 'Classical',
            keyExchange: 'Unknown',
            signatureAlgorithm: 'Unknown',
            readinessScore: readiness.score,
            recommendation: readiness.recommendation,
            migrationPriority: 'Medium',
            businessImpact: 'Medium',
            deploymentCriticality: 'Production',
            complianceMapping: ['NIST IR 8547', 'NIST SP 1800-38'],
            inventoryReferences: [inventory.inventoryId],
            cryptoAgilityClassification: 'Static Crypto',
            inventoryIdentifier: inventory.inventoryId,
            migrationRoadmapReferences: readiness.roadmap,
            file: sourceFile,
            line: 1,
            snippet: targetCode.split('\n')[0].substring(0, 100),
            api: 'ReadinessScoreCalculation',
            detectorVersion: this.version,
            evidenceQuality: 98
          })
        );
      }

      const duration = performance.now() - start;
      TelemetryService.recordHistogram('pqc.runtime.ms', duration);

      // Performance cap
      if (findings.length > 50) {
        return findings.slice(0, 50);
      }
    }

    return this.deduplicateFindings(findings);
  }

  private buildPqcFinding(rule: Rule, evidence: PqcEvidence): ScanFinding {
    const standardEvidence: Evidence = {
      file: evidence.file,
      line: evidence.line,
      snippet: evidence.snippet,
      matchedPattern: evidence.api,
      language: evidence.language,
      qualityScore: evidence.evidenceQuality
    };

    const finding = this.buildFinding(rule, standardEvidence, 90);
    finding.evidence = {
      ...finding.evidence,
      ...evidence
    } as any;

    return finding;
  }

  private deduplicateFindings(findings: ScanFinding[]): ScanFinding[] {
    const unique = new Map<string, ScanFinding>();
    for (const f of findings) {
      const key = `${f.ruleId}-${f.evidence.file}-${f.evidence.line}`;
      if (!unique.has(key)) {
        unique.set(key, f);
      } else {
        const existing = unique.get(key)!;
        if (f.confidence > existing.confidence) {
          unique.set(key, f);
        }
      }
    }
    return Array.from(unique.values());
  }
}
