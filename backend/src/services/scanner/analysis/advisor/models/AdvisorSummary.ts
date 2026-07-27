import { SecurityExplanation } from './SecurityExplanation';
import { SecurityInsight } from './SecurityInsight';
import { ReasoningTrace } from './ReasoningTrace';

export interface AdvisorSummary {
  readonly explanations: readonly SecurityExplanation[];
  readonly insights: readonly SecurityInsight[];
  readonly traces: readonly ReasoningTrace[];
}
