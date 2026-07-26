export interface BehaviourImpact {
  readonly apiPreserved: boolean;
  readonly logicPreserved: boolean;
  readonly performanceImpact: 'low' | 'medium' | 'high';
}
