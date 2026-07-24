import { FrameworkComponent } from '../models/FrameworkComponent';

export interface DiscoveryResult {
  readonly entryPoints: readonly FrameworkComponent[];
  readonly components: readonly FrameworkComponent[];
  readonly metadata: ReadonlyMap<string, any>;
}
