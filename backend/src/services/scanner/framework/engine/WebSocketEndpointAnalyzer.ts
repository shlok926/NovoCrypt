import { EndpointModel } from '../models/EndpointModel';

export class WebSocketEndpointAnalyzer {
  public static parseSocketEvent(line: string): EndpointModel | undefined {
    const match = line.match(/(?:socket)\.on\s*\(\s*['"`]([^'"`]+)['"`]/);
    if (match) {
      return {
        route: match[1],
        method: 'WS_ON',
        parameters: [],
        authRequired: false,
        validationApplied: false
      };
    }
    return undefined;
  }
}
