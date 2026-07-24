export interface ArtifactLocation {
  readonly uri: string;
  readonly uriBaseId?: string;
  readonly index?: number;
  readonly description?: { readonly text: string };
}

export interface Region {
  readonly startLine: number;
  readonly startColumn?: number;
  readonly endLine?: number;
  readonly endColumn?: number;
  readonly charOffset?: number;
  readonly charLength?: number;
}

export interface PhysicalLocation {
  readonly artifactLocation: ArtifactLocation;
  readonly region?: Region;
}

export interface Location {
  readonly physicalLocation: PhysicalLocation;
  readonly message?: { readonly text: string };
}
