import { RuleMetadata } from '../models/RuleMetadata';
import { RuleContext } from '../engine/RuleContext';
import { FrameworkFinding } from '../models/FrameworkFinding';

export interface FrameworkRule {
  readonly metadata: RuleMetadata;
  evaluate(context: RuleContext): FrameworkFinding[];
}

export interface RulePack {
  readonly name: string;
  readonly rules: readonly FrameworkRule[];
}
