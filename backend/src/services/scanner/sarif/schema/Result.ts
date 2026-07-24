import { Location } from './Location';

export interface Result {
  readonly ruleId: string;
  readonly ruleIndex?: number;
  readonly message: { readonly text: string; readonly markdown?: string };
  readonly level?: 'none' | 'note' | 'warning' | 'error';
  readonly locations: readonly Location[];
  readonly partialFingerprints?: Readonly<Record<string, string>>;
  readonly properties?: Readonly<Record<string, any>>;
}
