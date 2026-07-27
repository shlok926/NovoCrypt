import { RootCause } from '../models/RootCause';

export class RootCauseAnalyzer {
  public static analyze(vulnerabilityId: string, filePath: string): RootCause {
    return {
      vulnerabilityId,
      pattern: 'String concatenation of user input parameters',
      location: `${filePath}:L10-15`
    };
  }
}
