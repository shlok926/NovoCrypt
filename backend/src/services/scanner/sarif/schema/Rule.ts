export interface ReportingDescriptor {
  readonly id: string;
  readonly name?: string;
  readonly shortDescription: { readonly text: string };
  readonly fullDescription?: { readonly text: string };
  readonly helpUri?: string;
  readonly help?: { readonly text: string; readonly markdown?: string };
  readonly properties?: Readonly<Record<string, any>>;
}
