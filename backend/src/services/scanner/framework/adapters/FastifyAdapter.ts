import { FrameworkAdapter } from '../registry/FrameworkRegistry';

export class FastifyAdapter implements FrameworkAdapter {
  public readonly name = 'Fastify';

  public detect(codeLines: string[]): boolean {
    return codeLines.some(l => l.includes('fastify()') || l.includes("require('fastify')") || l.includes('import fastify'));
  }

  public getEndpoints(codeLines: string[]): any[] {
    return codeLines.filter(l => l.includes('fastify.route(') || l.includes('fastify.get('));
  }

  public getMiddlewares(codeLines: string[]): any[] {
    return codeLines.filter(l => l.includes('fastify.register('));
  }
}
