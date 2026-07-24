import { ReportingDescriptor } from './Rule';
import { Result } from './Result';

export interface Artifact {
  readonly location: { readonly uri: string };
  readonly roles?: readonly string[];
}

export interface Tool {
  readonly driver: {
    readonly name: string;
    readonly version?: string;
    readonly informationUri?: string;
    readonly rules: readonly ReportingDescriptor[];
  };
}

export interface Run {
  readonly tool: Tool;
  readonly results: readonly Result[];
  readonly artifacts?: readonly Artifact[];
  readonly properties?: Readonly<Record<string, any>>;
}
