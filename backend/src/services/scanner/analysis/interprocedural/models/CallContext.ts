import { CallString } from './CallString';

export interface CallContext {
  readonly callString: CallString;
  readonly depth: number;
  readonly callerFile?: string;
  readonly callerFunction?: string;
}
