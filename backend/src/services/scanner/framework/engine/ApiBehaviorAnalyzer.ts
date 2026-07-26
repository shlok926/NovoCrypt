import { ApiBehavior } from '../models/ApiBehavior';

export class ApiBehaviorAnalyzer {
  public static analyze(apiCall: string): ApiBehavior {
    if (apiCall.includes('query')) {
      return {
        inputs: ['sql_query_string'],
        outputs: ['result_set'],
        asyncBehavior: true,
        securityImplications: ['sql_injection']
      };
    }
    return {
      inputs: [],
      outputs: [],
      asyncBehavior: false,
      securityImplications: []
    };
  }
}
