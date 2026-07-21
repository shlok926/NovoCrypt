import { CryptoDetector, DetectorMetadata, ScanContext, ScanFinding, TargetType, Evidence, Rule, DetectionContext, SupportLevel, DetectionSupport, LanguageSupportMatrix, KnownBypassMatrix } from '../types';
import { BaseDetector } from '../framework/BaseDetector';
import { StaticCertificateAnalyzer } from './static-certificate-analyzer';
import { LiveTlsAnalyzer } from './live-tls-analyzer';

export class TlsX509Detector extends BaseDetector {
  id = 'detector-tls-x509';
  name = 'TLS / X.509 Enterprise Security Analyzer';
  version = '1.0.0';
  category = 'Transport Layer Security';
  supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'go', 'csharp',
    'yaml', 'json', 'pem', 'der', 'p12', 'pfx', 'crt', 'cer'
  ];
  supportedExtensions = [
    '.js', '.ts', '.py', '.java', '.go', '.cs', '.yaml', '.yml',
    '.json', '.pem', '.der', '.p12', '.pfx', '.crt', '.cer'
  ];

  languageMatrix: LanguageSupportMatrix = {
    supportedLanguages: this.supportedLanguages,
    languages: this.supportedLanguages.map(lang => ({
      language: lang,
      supportLevel: SupportLevel.FULL,
      notes: 'TLS socket handshakes and X.509 certificate parsing supported'
    }))
  };

  bypassMatrix: KnownBypassMatrix = {
    regex: DetectionSupport.FULL,
    templateLiterals: DetectionSupport.FULL,
    stringConcatenation: DetectionSupport.FULL,
    aliases: DetectionSupport.PARTIAL,
    factories: DetectionSupport.AST_REQUIRED,
    reflection: DetectionSupport.AST_REQUIRED,
    dynamicImports: DetectionSupport.AST_REQUIRED,
    unicode: DetectionSupport.PARTIAL,
    base64: DetectionSupport.FULL,
    hex: DetectionSupport.PARTIAL,
    environmentVariables: DetectionSupport.PARTIAL,
    wrapperMethods: DetectionSupport.AST_REQUIRED
  };

  capabilities = {
    id: 'tls-security',
    version: '1.0.0',
    category: ['Certificate Expiration', 'Protocol Security', 'Cipher Strength', 'Chain Trust'],
    supportsRegex: true,
    supportsCrossFileCorrelation: true,
    supportsTemplateResolution: true,
    supportsStaticAnalysis: true,
    supportsLanguageAwareness: true,
    supportsAST: false,
    supportsRuntimeAnalysis: true,
    supportsDataFlow: false,
    supportsReflection: false,
    supportsSecretsCorrelation: true,
    supportsNetworkInspection: true
  };
  
  metadata: DetectorMetadata = {
    version: '1.0.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v1',
    category: 'Transport Layer Security',
    documentationUrl: 'https://docs.novocrypt.app/detectors/tls-x509',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions,
    capabilities: this.capabilities,
    languageMatrix: this.languageMatrix,
    bypassMatrix: this.bypassMatrix
  };
  supportedTargets: TargetType[] = ['code', 'config', 'url'];
  
  private staticAnalyzer = new StaticCertificateAnalyzer();
  private liveAnalyzer = new LiveTlsAnalyzer();

  protected async executeDetection(context: ScanContext, detectionContext?: DetectionContext): Promise<ScanFinding[]> {
    const buildFindingProxy = (rule: Rule, evidence: Evidence, confidence: number): ScanFinding => {
      return this.buildFinding(rule, evidence, confidence);
    };

    if (context.targetType === 'url') {
      return await this.liveAnalyzer.analyze(context, buildFindingProxy);
    } else if (context.targetType === 'code' || context.targetType === 'config') {
      return await this.staticAnalyzer.analyze(context, buildFindingProxy);
    }
    
    return [];
  }
}
