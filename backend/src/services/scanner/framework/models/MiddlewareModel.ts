export type MiddlewareType = 'authentication' | 'validation' | 'logging' | 'generic';

export interface MiddlewareModel {
  readonly name: string;
  readonly orderIndex: number;
  readonly type: MiddlewareType;
  readonly bypassed: boolean;
}
