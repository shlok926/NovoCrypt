export const OWASPMapping: Record<string, string> = {
  'express-missing-auth': 'A01:2021-Broken Access Control',
  'express-missing-helmet': 'A05:2021-Security Misconfiguration',
  'express-missing-validation': 'A03:2021-Injection',
  'fastify-missing-validation': 'A03:2021-Injection',
  'nest-missing-guard': 'A01:2021-Broken Access Control',
  'nest-missing-validation-pipe': 'A03:2021-Injection',
  'nest-missing-exception-filter': 'A05:2021-Security Misconfiguration',
  'koa-middleware-ordering': 'A05:2021-Security Misconfiguration',
  'hapi-missing-validation': 'A03:2021-Injection'
};
