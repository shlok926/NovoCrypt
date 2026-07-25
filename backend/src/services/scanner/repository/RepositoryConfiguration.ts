import { DiscoveryOptions } from './discovery/FileDiscovery';

export interface RepositoryConfiguration extends DiscoveryOptions {
  readonly ignoredDirectories?: readonly string[];
  readonly ignoredFiles?: readonly string[];
  readonly languageFilters?: readonly string[];
  readonly frameworkFilters?: readonly string[];
  readonly workerCount?: number;
  readonly cacheEnabled?: boolean;
  readonly incrementalEnabled?: boolean;
}
