export interface PatchConfidence {
  readonly score: number;
  readonly label: 'Low' | 'Medium' | 'High';
  readonly contributors: readonly string[];
}
