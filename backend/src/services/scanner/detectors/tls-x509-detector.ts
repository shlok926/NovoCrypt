import { ScanContext, ScanFinding, TargetType, DetectorMetadata, Evidence, Rule } from '../types';
import { BaseDetector } from '../framework/BaseDetector';
import { StaticCertificateAnalyzer } from './static-certificate-analyzer';
import { LiveTlsAnalyzer } from './live-tls-analyzer';

export class TlsX509Detector extends BaseDetector {
  id = 'detector-tls-x509';
  name = 'TLS / X.509 Security Analyzer';
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
  
  metadata: DetectorMetadata = {
    version: '1.0.0',
    author: 'NovoCrypt Security Team',
    ruleVersion: 'v1',
    category: 'Transport Layer Security',
    documentationUrl: 'https://docs.novocrypt.app/detectors/tls-x509',
    supportedLanguages: this.supportedLanguages,
    supportedExtensions: this.supportedExtensions
  };
  supportedTargets: TargetType[] = ['code', 'config', 'url'];
  
  capabilities = {
    id: 'tls-security',
    version: '1.0.0',
    languages: this.supportedLanguages,
    categories: ['Certificate Expiration', 'Protocol Security', 'Cipher Strength', 'Chain Trust'],
    supportsAst: true
  };
  
  private staticAnalyzer = new StaticCertificateAnalyzer();
  private liveAnalyzer = new LiveTlsAnalyzer();

  protected async executeDetection(context: ScanContext): Promise<ScanFinding[]> {
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
