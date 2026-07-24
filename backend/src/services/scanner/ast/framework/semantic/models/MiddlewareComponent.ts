import { NovoNode } from '../../../NovoNode';

export type MiddlewareKind = 'Middleware' | 'Guard' | 'Pipe' | 'Interceptor' | 'ExceptionFilter';

export interface MiddlewareComponent {
  readonly id: string;
  readonly kind: MiddlewareKind;
  readonly node: NovoNode;
  readonly order: number;
  readonly metadata: ReadonlyMap<string, any>;
}
