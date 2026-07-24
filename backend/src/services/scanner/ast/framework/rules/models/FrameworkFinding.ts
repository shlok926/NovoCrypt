import { NovoNode } from '../../../NovoNode';
import { FrameworkType } from '../../models/FrameworkModel';
import { RequestExecutionPipeline } from '../../semantic/models/RequestExecutionPipeline';
import { RuleEvidence } from './RuleEvidence';

export interface FrameworkFinding {
  readonly id: string; // e.g. finding-00001
  readonly ruleId: string;
  readonly title: string;
  readonly description: string;
  readonly severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  readonly confidence: number; // 0-100
  readonly framework: FrameworkType;
  readonly route: string;
  readonly handler: NovoNode;
  readonly executionPipeline: RequestExecutionPipeline;
  readonly evidence: RuleEvidence;
  readonly suggestedRemediation: string;
}
