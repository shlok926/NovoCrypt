import * as ts from 'typescript';
import { RulePack, FrameworkRule } from '../registry/RulePack';
import { RuleContext } from '../engine/RuleContext';
import { FrameworkFinding } from '../models/FrameworkFinding';
import { NovoNode } from '../../../NovoNode';

export class HapiRulePack implements RulePack {
  public readonly name = 'Hapi Security Rule Pack';

  public readonly rules: readonly FrameworkRule[] = [
    {
      metadata: {
        id: 'hapi-missing-validation',
        name: 'Hapi Route Missing Parameters Validation',
        version: '1.0.0',
        category: 'Validation',
        severity: 'medium',
        supportedFrameworks: ['Hapi'],
        tags: ['security', 'validation'],
        references: ['https://hapi.dev/tutorials/validation/'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        const hasVal = hasHapiValidation(pipeline.handler);
        if (!hasVal) {
          findings.push({
            id: '',
            ruleId: this.metadata.id,
            title: 'Hapi Route Missing Parameters Validation',
            description: `The Hapi route '${pipeline.path}' does not define parameter validation rules.`,
            severity: 'medium',
            confidence: 90,
            framework: 'Hapi',
            route: pipeline.path,
            handler: pipeline.handler,
            executionPipeline: pipeline,
            evidence: {
              summary: 'No validate property configuration was found on the Hapi route registration.',
              route: pipeline.path,
              relatedNodes: [pipeline.handler],
              relatedComponents: []
            },
            suggestedRemediation: 'Provide a validation configuration block under the "options.validate" or "validate" property (e.g. validate: { payload: Joi.object(...) }).'
          });
        }

        return findings;
      }
    }
  ];
}

function hasHapiValidation(handlerNode: NovoNode): boolean {
  let current: NovoNode | undefined = handlerNode.parent;
  while (current) {
    const native = current.rawReference?.ref as any;
    if (native && ts.isObjectLiteralExpression(native)) {
      const hasVal = native.properties.some(prop => {
        return ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === 'validate';
      });
      if (hasVal) return true;
    }
    current = current.parent;
  }
  return false;
}
