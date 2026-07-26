export interface RegressionRisk {
  readonly score: number;
  readonly label: 'Low' | 'Medium' | 'High';
}
