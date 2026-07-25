import { RuleProfile } from '../models/RuleProfile';

export const DefaultProfile: RuleProfile = {
  id: 'default',
  name: 'Default Execution Profile',
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
  minimumSeverity: 'low',
  confidenceThreshold: 0,
  executionMode: 'governed'
};
