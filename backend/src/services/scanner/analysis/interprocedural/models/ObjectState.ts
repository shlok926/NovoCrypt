export interface ObjectState {
  readonly properties: ReadonlyMap<string, any>;
  readonly mutationsCount: number;
}
