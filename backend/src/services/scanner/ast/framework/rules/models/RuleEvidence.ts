import { NovoNode } from '../../../NovoNode';

export interface RuleEvidence {
  readonly summary: string;
  readonly route?: string;
  readonly lifecycleStage?: string;
  readonly middleware?: string;
  readonly relatedNodes: readonly NovoNode[];
  readonly relatedComponents: readonly string[];
}
