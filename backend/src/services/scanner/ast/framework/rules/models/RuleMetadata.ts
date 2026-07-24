import { FrameworkType } from '../../models/FrameworkModel';

export interface RuleMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: string;
  readonly severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  readonly supportedFrameworks: readonly FrameworkType[];
  readonly tags: readonly string[];
  readonly references: readonly string[];
  readonly defaultEnabled: boolean;
}
