import { EndpointModel } from '../models/EndpointModel';

export class RpcEndpointAnalyzer {
  public static parseRpc(line: string): EndpointModel | undefined {
    const match = line.match(/(?:rpc)\.register\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (match) {
      return {
        route: match[1],
        method: 'RPC',
        parameters: [],
        authRequired: false,
        validationApplied: false
      };
    }
    return undefined;
  }
}
