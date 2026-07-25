import { RuleProfile } from '../models/RuleProfile';

export const CIProfile: RuleProfile = {
  id: 'ci',
  name: 'Continuous Integration Fast Profile',
  enabledRules: [
    'express-missing-auth',
    'express-missing-validation',
    'fastify-missing-validation',
    'nest-missing-guard',
    'nest-missing-validation-pipe',
    'koa-middleware-ordering',
    'hapi-missing-validation'
  ],
  minimumSeverity: 'medium',
  confidenceThreshold: 75,
  executionMode: 'fast'
};
