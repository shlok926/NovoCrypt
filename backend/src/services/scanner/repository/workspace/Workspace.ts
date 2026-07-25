export interface Workspace {
  readonly root: string;
  readonly discoveredFiles: readonly string[];
  readonly languageStatistics: Readonly<Record<string, number>>;
  readonly detectedFrameworks: readonly string[];
  readonly metadata: ReadonlyMap<string, any>;
}
