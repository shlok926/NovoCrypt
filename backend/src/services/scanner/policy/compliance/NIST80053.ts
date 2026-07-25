export const NIST80053Mapping: Record<string, string> = {
  'express-missing-auth': 'NIST-AC-2',
  'express-missing-helmet': 'NIST-SC-8',
  'express-missing-validation': 'NIST-SI-10',
  'fastify-missing-validation': 'NIST-SI-10',
  'nest-missing-guard': 'NIST-AC-2',
  'nest-missing-validation-pipe': 'NIST-SI-10',
  'nest-missing-exception-filter': 'NIST-SC-8',
  'koa-middleware-ordering': 'NIST-SC-8',
  'hapi-missing-validation': 'NIST-SI-10'
};
