import { MiddlewareComponent } from './MiddlewareComponent';
import { NovoNode } from '../../../NovoNode';

export interface LifecycleStage {
  readonly kind: string; // e.g. "onRequest", "guard", "preHandler", "pipe", "handler", "postHandler", "exceptionFilter", "onResponse"
  readonly order: number;
  readonly component?: MiddlewareComponent | NovoNode;
  readonly metadata: ReadonlyMap<string, any>;
}
