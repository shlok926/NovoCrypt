import { EndpointModel } from '../models/EndpointModel';

export class RestEndpointAnalyzer {
  public static parseRoute(line: string): EndpointModel | undefined {
    const match = line.match(/(?:app|router)\.(get|post|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/i);
    if (match) {
      return {
        route: match[2],
        method: match[1].toUpperCase(),
        parameters: [],
        authRequired: false,
        validationApplied: false
      };
    }
    return undefined;
  }
}
