import { NovoNode } from '../../NovoNode';

export interface RouteDescriptor {
  readonly path: string;
  readonly method: string; // HTTP method (e.g. GET, POST, PUT, DELETE, USE)
  readonly handler: NovoNode;
  readonly middleware: readonly NovoNode[];
  readonly controller?: NovoNode;
  readonly parentRouter?: NovoNode;
  readonly metadata: ReadonlyMap<string, any>;
}
