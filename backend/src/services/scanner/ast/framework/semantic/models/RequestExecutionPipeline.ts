import { NovoNode } from '../../../NovoNode';
import { FrameworkType } from '../../models/FrameworkModel';
import { MiddlewareComponent } from './MiddlewareComponent';

export interface RequestExecutionPipeline {
  readonly path: string;
  readonly method: string;
  readonly handler: NovoNode;
  readonly preMiddleware: readonly MiddlewareComponent[];
  readonly postMiddleware: readonly MiddlewareComponent[];
  readonly pipes: readonly MiddlewareComponent[];
  readonly controllerNode?: NovoNode;
  readonly routerNode?: NovoNode;
  readonly framework: FrameworkType;
}
