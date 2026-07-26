export type PatchStrategyType =
  | 'replaceApi'
  | 'addValidation'
  | 'addMiddleware'
  | 'escapeOutput'
  | 'parameterizeQuery'
  | 'insertAuthentication'
  | 'insertAuthorization'
  | 'refactorLogic';

export interface PatchStrategy {
  readonly strategy: PatchStrategyType;
  readonly description: string;
}
