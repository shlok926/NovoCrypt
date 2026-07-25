import { CallContext } from '../models/CallContext';
import { CallString } from '../models/CallString';

export class ContextAnalyzer {
  public static createContext(
    callerFile?: string,
    callerFunction?: string,
    callString: CallString = new CallString(['global'])
  ): CallContext {
    const key = callerFunction || 'global';
    const nextString = callString.push(key);
    return {
      callString: nextString,
      depth: nextString.depth,
      callerFile,
      callerFunction
    };
  }
}
