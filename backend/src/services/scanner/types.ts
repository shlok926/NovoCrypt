import { Logger, TelemetryService } from '../observability';
import crypto from 'crypto';

export type TargetType = 'code' | 'url' | 'config' | 'archive';

export type PathFilteringMode = 'enterprise' | 'strict' | 'disabled';

export interface ScanConfiguration {
  maxDepth?: number;
  customPolicies?: Record<string, unknown>;
  pathFiltering?: {
    mode: PathFilteringMode;
  };
}

export interface ExecutionOptions {
  timeoutMs?: number;
  maxFileSize?: number;
  enableTelemetry?: boolean;
}

export enum SupportLevel {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  NONE = 'NONE'
}

export enum DetectionSupport {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  NONE = 'NONE',
  AST_REQUIRED = 'AST_REQUIRED'
}

export interface LanguageSupport {
  language: string;
  supportLevel: SupportLevel;
  notes?: string;
}

export interface LanguageSupportMatrix {
  supportedLanguages: string[];
  languages: LanguageSupport[];
}

export interface KnownBypassMatrix {
  regex: DetectionSupport;
  templateLiterals: DetectionSupport;
  stringConcatenation: DetectionSupport;
  aliases: DetectionSupport;
  factories: DetectionSupport;
  reflection: DetectionSupport;
  dynamicImports: DetectionSupport;
  unicode: DetectionSupport;
  base64: DetectionSupport;
  hex: DetectionSupport;
  environmentVariables: DetectionSupport;
  wrapperMethods: DetectionSupport;
}

export interface ScannerCapabilities {
  supportsRegex?: boolean;
  supportsCrossFileCorrelation?: boolean;
  supportsTemplateResolution?: boolean;
  supportsStaticAnalysis?: boolean;
  supportsLanguageAwareness?: boolean;
  supportsAST?: boolean;
  supportsRuntimeAnalysis?: boolean;
  supportsDataFlow?: boolean;
  supportsReflection?: boolean;
  supportsSecretsCorrelation?: boolean;
  supportsNetworkInspection?: boolean;
  supportsTelemetry?: boolean;
}

export interface PathClassification {
  isProductionFile: boolean;
  isTestFile: boolean;
  isGenerated: boolean;
  isDocumentation: boolean;
  category: 'production' | 'test' | 'documentation' | 'example' | 'build' | 'unknown';
}

export interface ResolvedString {
  original: string;
  resolved: string;
  confidence: number;
  isResolved: boolean;
}

export interface DetectionContext {
  scanContext: ScanContext;
  pathClassification: PathClassification;
  resolvedStrings: Map<number, ResolvedString>;
  language: string;
  languageSupport?: LanguageSupport;
}

export interface AstContext {}

export class ScanSharedState {
  public readonly jwtSecrets = new Map<string, { file: string; line: number; secretType: string }>();
  public readonly aesKeys = new Map<string, { file: string; line: number; keyType: string }>();
  public readonly pqcClassical = new Map<string, { file: string; line: number; alg: string }>();
  public readonly metadata = new Map<string, unknown>();

  public clear(): void {
    this.jwtSecrets.clear();
    this.aesKeys.clear();
    this.pqcClassical.clear();
    this.metadata.clear();
  }
}

export interface ScanContextMetadata {
  frameworkVersion: string;
  scanVersion: string;
  detectorApiVersion: string;
}

export interface ScanServices {
  logger: Logger;
  telemetry: typeof TelemetryService;
}

export class ScanContext {
  public readonly scanId: string;
  public readonly targetType: TargetType;
  public readonly target: string;
  public readonly fileName?: string;
  public readonly language?: string;
  public readonly services: ScanServices;
  public readonly metadata: ScanContextMetadata;
  public readonly configuration: ScanConfiguration;
  
  public readonly sharedState: ScanSharedState;
  public executionOptions: ExecutionOptions;
  public capabilities: ScannerCapabilities;
  public ast?: AstContext;

  constructor(options: {
    targetType: TargetType;
    target: string;
    fileName?: string;
    language?: string;
    scanId?: string;
    sharedState?: ScanSharedState;
    configuration?: ScanConfiguration;
    executionOptions?: ExecutionOptions;
    capabilities?: ScannerCapabilities;
    metadata?: ScanContextMetadata;
    services?: ScanServices;
  }) {
    this.targetType = options.targetType;
    this.target = options.target;
    this.fileName = options.fileName;
    this.language = options.language;
    this.services = options.services || {
      logger: new Logger({ component: 'ScanContext' }),
      telemetry: TelemetryService
    };
    this.scanId = options.scanId || crypto.randomUUID();
    this.configuration = options.configuration || {};
    
    this.executionOptions = options.executionOptions || {
      timeoutMs: 250,
      maxFileSize: 100 * 1024,
      enableTelemetry: true
    };
    
    this.capabilities = options.capabilities || {
      supportsAST: false, 
      supportsCrossFileCorrelation: true,
      supportsTelemetry: true
    };
    
    this.metadata = options.metadata || {
      frameworkVersion: '1.0.0',
      scanVersion: '1.0.0',
      detectorApiVersion: 'v1'
    };
    
    this.ast = undefined;
    this.sharedState = options.sharedState || new ScanSharedState();
  }

  public getAst(file: string): AstContext | undefined { 
    return undefined; 
  }
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Evidence {
  file?: string;
  line?: number;
  column?: number;
  snippet: string;
  matchedPattern: string;
  language?: string;
  qualityScore: number;
}

export interface ConfidenceExplanation {
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface Rule {
  id: string; // e.g., 'RULE_RSA_001'
  title: string;
  description: string;
  severity: Severity;
  algorithm?: string;
  keySize?: number;
  currentRisk: string;
  quantumRisk: string;
  recommendation: string;
  references: string[];
}

export interface ScanFinding {
  id: string; // uuid
  ruleId: string;
  detectorId: string;
  detectorVersion: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  confidence: number; // 0-100%
  confidenceExplanation: ConfidenceExplanation;
  evidence: Evidence;
  algorithm?: string;
  keySize?: number;
  currentRisk: string;
  quantumRisk: string;
  recommendation: string;
  references: string[];
  fingerprint: string;
  timestamp: string;
}

export interface DetectorHealth {
  status: 'healthy' | 'degraded' | 'failed';
  errorCount: number;
  lastError?: string;
  averageRuntimeMs: number;
}

export interface DetectorMetadata {
  version: string;
  author: string;
  ruleVersion: string;
  category: string;
  documentationUrl: string;
  supportedLanguages: string[];
  supportedExtensions: string[];
  capabilities?: ScannerCapabilities;
  languageMatrix?: LanguageSupportMatrix;
  bypassMatrix?: KnownBypassMatrix;
}

export interface CryptoDetector {
  id: string;
  name: string;
  version: string;
  category: string;
  supportedLanguages: string[];
  supportedExtensions: string[];
  metadata: DetectorMetadata;
  supportedTargets: TargetType[];
  capabilities?: ScannerCapabilities;
  languageMatrix?: LanguageSupportMatrix;
  bypassMatrix?: KnownBypassMatrix;
  detect(context: ScanContext): Promise<ScanFinding[]>;
  health(): DetectorHealth;
  initialize(context: ScanContext): Promise<void> | void;
  dispose(context: ScanContext): Promise<void> | void;
  onRegister(): Promise<void> | void;
  onUnregister(): Promise<void> | void;
}

export interface ScanMetrics {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface ScanResultData {
  findings: ScanFinding[];
  metrics: ScanMetrics;
  overallRiskScore: number; // 0-100
  quantumReadinessScore: number; // 0-100
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  criticalFindings: ScanFinding[];
  topRecommendations: string[];
  algorithmsFound: string[];
}
