export interface FixComparison {
  readonly strategy: string;
  readonly security: 'Low' | 'Medium' | 'High';
  readonly compatibility: 'Low' | 'Medium' | 'High';
  readonly complexity: 'Low' | 'Medium' | 'High';
}
