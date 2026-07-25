export type SymbolicValueType =
  | 'integer'
  | 'string'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null'
  | 'undefined'
  | 'unknown';

export interface SymbolicValue {
  readonly name: string;
  readonly type: SymbolicValueType;
}
