import { RuleProfile } from '../models/RuleProfile';

export const StrictProfile: RuleProfile = {
  id: 'strict',
  name: 'Strict Security Audit Profile',
  enabledRules: [
    'express-missing-auth',
    'express-missing-helmet',
    'express-missing-validation',
    'fastify-missing-validation',
    'nest-missing-guard',
    'nest-missing-validation-pipe',
    'nest-missing-exception-filter',
    'koa-middleware-ordering',
    'hapi-missing-validation'
  ],
  minimumSeverity: 'high',
  confidenceThreshold: 85,
  executionMode: 'deep'
};
