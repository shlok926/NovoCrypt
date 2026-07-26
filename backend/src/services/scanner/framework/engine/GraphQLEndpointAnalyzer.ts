import { EndpointModel } from '../models/EndpointModel';

export class GraphQLEndpointAnalyzer {
  public static parseResolver(line: string): EndpointModel | undefined {
    const match = line.match(/(?:Query|Mutation)\s*:\s*{\s*(\w+)/);
    if (match) {
      return {
        route: match[1],
        method: 'GraphQL',
        parameters: [],
        authRequired: false,
        validationApplied: false
      };
    }
    return undefined;
  }
}
