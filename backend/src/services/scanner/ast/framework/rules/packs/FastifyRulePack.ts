import * as ts from 'typescript';
import { RulePack, FrameworkRule } from '../registry/RulePack';
import { RuleContext } from '../engine/RuleContext';
import { FrameworkFinding } from '../models/FrameworkFinding';
import { NovoNode } from '../../../NovoNode';

export class FastifyRulePack implements RulePack {
  public readonly name = 'Fastify Security Rule Pack';

  public readonly rules: readonly FrameworkRule[] = [
    {
      metadata: {
        id: 'fastify-missing-validation',
        name: 'Fastify Route Missing Schema Validation',
        description: 'The Fastify route registration does not configure JSON schema validations.',
        version: '1.0.0',
        category: 'Validation',
        severity: 'medium',
        supportedFrameworks: ['Fastify'],
        tags: ['security', 'validation'],
        references: ['https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline, metadata } = context;

        // Find the route component matching this pipeline's handler
        const routeComp = metadata.components.find(c => {
          return c.kind === 'RequestHandler' && c.route?.handler.rawReference?.ref === pipeline.handler.rawReference?.ref;
        });

        if (routeComp) {
          const hasSchema = hasFastifySchema(routeComp.astNode);
          if (!hasSchema) {
            findings.push({
              id: '',
              ruleId: this.metadata.id,
              title: 'Fastify Route Missing Schema Validation',
              description: `The route '${pipeline.path}' does not define any JSON schema validation constraints.`,
              severity: 'medium',
              confidence: 90,
              framework: 'Fastify',
              route: pipeline.path,
              handler: pipeline.handler,
              executionPipeline: pipeline,
              evidence: {
                summary: 'No schema declaration was found in the Fastify route options.',
                route: pipeline.path,
                relatedNodes: [routeComp.astNode],
                relatedComponents: [routeComp.id]
              },
              suggestedRemediation: 'Provide a validation schema object under the "schema" property (e.g. schema: { body: ... }) in route registration.'
            });
          }
        }

        return findings;
      }
    }
  ];
}

function hasFastifySchema(callNode: NovoNode): boolean {
  const native = callNode.rawReference?.ref as any;
  if (!native || !ts.isCallExpression(native)) return false;
  if (native.arguments.length > 0) {
    const firstArg = native.arguments[0];
    if (ts.isObjectLiteralExpression(firstArg)) {
      return firstArg.properties.some(prop => {
        return ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'schema';
      });
    }
  }
  return false;
}
