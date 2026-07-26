export interface ApiBehavior {
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly asyncBehavior: boolean;
  readonly securityImplications: readonly string[];
}
