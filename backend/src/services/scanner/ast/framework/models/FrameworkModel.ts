export type FrameworkType = 'Express' | 'Fastify' | 'NestJS' | 'Koa' | 'Hapi' | 'Unknown';

export type DiscoveredComponentKind =
  | 'Application'
  | 'Module'
  | 'Router'
  | 'Controller'
  | 'Middleware'
  | 'RequestHandler'
  | 'ErrorHandler'
  | 'Decorator'
  | 'Bootstrap';
