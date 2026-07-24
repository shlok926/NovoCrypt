import { LifecycleStage } from './LifecycleStage';

export interface RequestLifecycle {
  readonly stages: readonly LifecycleStage[];
}
