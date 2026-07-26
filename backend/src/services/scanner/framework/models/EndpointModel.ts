export interface EndpointModel {
  readonly route: string;
  readonly method: string;
  readonly parameters: readonly string[];
  readonly authRequired: boolean;
  readonly validationApplied: boolean;
}
