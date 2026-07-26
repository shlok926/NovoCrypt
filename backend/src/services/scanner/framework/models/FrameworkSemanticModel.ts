import { FrameworkVersion } from './FrameworkVersion';
import { FrameworkCapability } from './FrameworkCapability';
import { EndpointModel } from './EndpointModel';
import { MiddlewareModel } from './MiddlewareModel';

export interface FrameworkSemanticModel {
  readonly name: string;
  readonly version: FrameworkVersion;
  readonly capabilities: readonly FrameworkCapability[];
  readonly endpoints: readonly EndpointModel[];
  readonly middlewares: readonly MiddlewareModel[];
}
