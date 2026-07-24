import { RulePack, FrameworkRule } from '../registry/RulePack';
import { RuleContext } from '../engine/RuleContext';
import { FrameworkFinding } from '../models/FrameworkFinding';

export class NestRulePack implements RulePack {
  public readonly name = 'NestJS Security Rule Pack';

  public readonly rules: readonly FrameworkRule[] = [
    {
      metadata: {
        id: 'nest-missing-guard',
        name: 'NestJS Endpoint Missing Guards Protection',
        description: 'The sensitive NestJS route does not configure any authorization guards.',
        version: '1.0.0',
        category: 'Authentication',
        severity: 'high',
        supportedFrameworks: ['NestJS'],
        tags: ['security', 'guard'],
        references: ['https://docs.nestjs.com/guards'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        const isSensitive = pipeline.path.includes('admin') || pipeline.path.includes('private') || pipeline.path.includes('secure');
        if (!isSensitive) return [];

        const hasGuard = pipeline.preMiddleware.some(m => m.kind === 'Guard');
        if (!hasGuard) {
          findings.push({
            id: '',
            ruleId: this.metadata.id,
            title: 'NestJS Endpoint Missing Guards Protection',
            description: `The sensitive NestJS route '${pipeline.path}' does not configure any authorization guards.`,
            severity: 'high',
            confidence: 90,
            framework: 'NestJS',
            route: pipeline.path,
            handler: pipeline.handler,
            executionPipeline: pipeline,
            evidence: {
              summary: 'No Guard decorator (@UseGuards) was detected on the controller or method handler.',
              route: pipeline.path,
              relatedNodes: [pipeline.handler],
              relatedComponents: []
            },
            suggestedRemediation: 'Apply authorization guards using @UseGuards(...) decorator on either the controller class or route method.'
          });
        }

        return findings;
      }
    },
    {
      metadata: {
        id: 'nest-missing-validation-pipe',
        name: 'NestJS Endpoint Missing Validation Pipes',
        description: 'The NestJS route does not configure request validation pipes.',
        version: '1.0.0',
        category: 'Validation',
        severity: 'medium',
        supportedFrameworks: ['NestJS'],
        tags: ['security', 'pipe'],
        references: ['https://docs.nestjs.com/pipes'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        const hasValidationPipe = pipeline.pipes.some(p => p.kind === 'Pipe');
        if (!hasValidationPipe) {
          findings.push({
            id: '',
            ruleId: this.metadata.id,
            title: 'NestJS Endpoint Missing Validation Pipe',
            description: `The NestJS route '${pipeline.path}' does not configure any request validation pipes.`,
            severity: 'medium',
            confidence: 90,
            framework: 'NestJS',
            route: pipeline.path,
            handler: pipeline.handler,
            executionPipeline: pipeline,
            evidence: {
              summary: 'No Validation Pipe decorator (@UsePipes) was detected in the request execution pipeline.',
              route: pipeline.path,
              relatedNodes: [pipeline.handler],
              relatedComponents: []
            },
            suggestedRemediation: 'Configure ValidationPipe: @UsePipes(new ValidationPipe()) or configure global validation pipes in your main bootstrap.'
          });
        }

        return findings;
      }
    },
    {
      metadata: {
        id: 'nest-missing-exception-filter',
        name: 'NestJS Endpoint Missing Exception Filters',
        description: 'The NestJS route does not register custom exception filters.',
        version: '1.0.0',
        category: 'Configuration',
        severity: 'low',
        supportedFrameworks: ['NestJS'],
        tags: ['security', 'filter'],
        references: ['https://docs.nestjs.com/exception-filters'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        const hasFilter = pipeline.postMiddleware.some(f => f.kind === 'ExceptionFilter');
        if (!hasFilter) {
          findings.push({
            id: '',
            ruleId: this.metadata.id,
            title: 'NestJS Endpoint Missing Exception Filters',
            description: `The NestJS route '${pipeline.path}' does not register any custom exception filters.`,
            severity: 'low',
            confidence: 90,
            framework: 'NestJS',
            route: pipeline.path,
            handler: pipeline.handler,
            executionPipeline: pipeline,
            evidence: {
              summary: 'No Exception Filter decorator (@UseFilters) was detected in the execution pipeline.',
              route: pipeline.path,
              relatedNodes: [pipeline.handler],
              relatedComponents: []
            },
            suggestedRemediation: 'Configure custom exception filters to sanitize error messages before they reach client layers: @UseFilters(HttpExceptionFilter)'
          });
        }

        return findings;
      }
    }
  ];
}
