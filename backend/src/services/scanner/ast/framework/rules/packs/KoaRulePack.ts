import * as ts from 'typescript';
import { RulePack, FrameworkRule } from '../registry/RulePack';
import { RuleContext } from '../engine/RuleContext';
import { FrameworkFinding } from '../models/FrameworkFinding';
import { NovoNode } from '../../../NovoNode';

export class KoaRulePack implements RulePack {
  public readonly name = 'Koa Security Rule Pack';

  public readonly rules: readonly FrameworkRule[] = [
    {
      metadata: {
        id: 'koa-middleware-ordering',
        name: 'Koa Sensitive Middleware Ordering Issues',
        description: 'Verify ordering constraints of critical middlewares (e.g. bodyParser, session must run before router).',
        version: '1.0.0',
        category: 'Configuration',
        severity: 'high',
        supportedFrameworks: ['Koa'],
        tags: ['security', 'ordering'],
        references: ['https://koajs.com/'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        let routerIdx = -1;
        let sensitiveIdx = -1;
        let sensitiveName = '';
        let routerNode: NovoNode | undefined;
        let sensitiveNode: NovoNode | undefined;

        pipeline.preMiddleware.forEach((m, idx) => {
          const name = getMiddlewareName(m.node).toLowerCase();
          
          if (name.includes('router') || name.includes('routes')) {
            routerIdx = idx;
            routerNode = m.node;
          }
          if (name.includes('session') || name.includes('body') || name.includes('parser')) {
            sensitiveIdx = idx;
            sensitiveName = name;
            sensitiveNode = m.node;
          }
        });

        // In Koa, parser and session middlewares must execute BEFORE the router middleware
        if (routerIdx !== -1 && sensitiveIdx !== -1 && routerIdx < sensitiveIdx) {
          findings.push({
            id: '',
            ruleId: this.metadata.id,
            title: 'Koa Sensitive Middleware Ordering Issue',
            description: `The Koa router is registered BEFORE the parser/session middleware (${sensitiveName}).`,
            severity: 'high',
            confidence: 95,
            framework: 'Koa',
            route: pipeline.path,
            handler: pipeline.handler,
            executionPipeline: pipeline,
            evidence: {
              summary: `Router index (${routerIdx}) is registered before session/parser index (${sensitiveIdx}).`,
              route: pipeline.path,
              relatedNodes: [routerNode!, sensitiveNode!],
              relatedComponents: []
            },
            suggestedRemediation: 'Register body parsers, session managers, and security headers before registering router routes in the app.use() sequence.'
          });
        }

        return findings;
      }
    }
  ];
}

function getMiddlewareName(node: NovoNode): string {
  let native = node.rawReference?.ref as any;
  if (!native) return '';
  if (ts.isCallExpression(native)) {
    const expr = native.expression;
    if (ts.isPropertyAccessExpression(expr) && (expr.name.text === 'use' || expr.name.text === 'routes') && native.arguments.length > 0) {
      native = native.arguments[0];
    }
  }
  if (ts.isIdentifier(native)) return native.text;
  if (ts.isCallExpression(native)) {
    if (ts.isIdentifier(native.expression)) return native.expression.text;
    if (ts.isPropertyAccessExpression(native.expression)) return native.expression.name.text;
  }
  return '';
}
