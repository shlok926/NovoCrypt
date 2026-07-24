import { NovoNode } from '../../NovoNode';
import { FrameworkType, DiscoveredComponentKind } from './FrameworkModel';
import { RouteDescriptor } from './RouteDescriptor';

export interface FrameworkComponent {
  readonly id: string;
  readonly framework: FrameworkType;
  readonly kind: DiscoveredComponentKind;
  readonly name: string;
  readonly sourceFile: string;
  readonly astNode: NovoNode;
  readonly route?: RouteDescriptor;
  readonly parentRouterId?: string;
  readonly parentControllerId?: string;
  readonly associatedMiddlewareIds?: readonly string[];
  readonly metadata: ReadonlyMap<string, any>;
}
