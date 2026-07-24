import { Run } from './Run';

export interface SarifReport {
  readonly version: '2.1.0';
  readonly $schema: string;
  readonly runs: readonly Run[];
}
