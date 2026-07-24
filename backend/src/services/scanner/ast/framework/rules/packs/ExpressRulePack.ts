import * as ts from 'typescript';
import { RulePack, FrameworkRule } from '../registry/RulePack';
import { RuleContext } from '../engine/RuleContext';
import { FrameworkFinding } from '../models/FrameworkFinding';
import { NovoNode } from '../../../NovoNode';

export class ExpressRulePack implements RulePack {
  public readonly name = 'Express Security Rule Pack';

  public readonly rules: readonly FrameworkRule[] = [
    {
      metadata: {
        id: 'express-missing-auth',
        name: 'Express Route Missing Authentication',
        description: 'The sensitive route does not configure any authentication middleware.',
        version: '1.0.0',
        category: 'Authentication',
        severity: 'high',
        supportedFrameworks: ['Express'],
        tags: ['security', 'auth'],
        references: ['https://expressjs.com/en/advanced/best-practice-security.html'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        const isSensitivePath = pipeline.path.startsWith('/admin') || pipeline.path.startsWith('/private') || pipeline.path.startsWith('/api/admin');
        if (!isSensitivePath) return [];

        const hasAuth = pipeline.preMiddleware.some(m => {
          const name = getMiddlewareName(m.node).toLowerCase();
          return name.includes('auth') || name.includes('passport') || name.includes('login') || name.includes('session');
        });

        if (!hasAuth) {
          findings.push(createFinding(
            this.metadata.id,
            'Express Route Missing Authentication Middleware',
            `The sensitive route '${pipeline.path}' does not configure any authentication middleware (e.g. auth, passport).`,
            'high',
            context,
            'Configure authentication middleware (e.g. app.use(auth) or router.get("/path", auth, handler)) before this route.'
          ));
        }

        return findings;
      }
    },
    {
      metadata: {
        id: 'express-missing-helmet',
        name: 'Express Missing Helmet Protection Headers',
        description: 'Helmet security headers middleware is not detected in the Express application execution pipeline.',
        version: '1.0.0',
        category: 'Headers',
        severity: 'medium',
        supportedFrameworks: ['Express'],
        tags: ['security', 'headers'],
        references: ['https://helmetjs.github.io/'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        // Check if global helmet is present in preMiddleware
        const hasHelmet = pipeline.preMiddleware.some(m => {
          const name = getMiddlewareName(m.node).toLowerCase();
          return name.includes('helmet');
        });

        if (!hasHelmet) {
          findings.push(createFinding(
            this.metadata.id,
            'Express Missing Helmet Protection',
            'Helmet security headers middleware is not detected in the Express application execution pipeline.',
            'medium',
            context,
            'Install and configure helmet middleware: app.use(require("helmet")())'
          ));
        }

        return findings;
      }
    },
    {
      metadata: {
        id: 'express-missing-validation',
        name: 'Express Route Missing Validation Middleware',
        description: 'The route does not configure input validation middleware.',
        version: '1.0.0',
        category: 'Validation',
        severity: 'medium',
        supportedFrameworks: ['Express'],
        tags: ['security', 'validation'],
        references: ['https://express-validator.github.io/docs/'],
        defaultEnabled: true
      },
      evaluate(context: RuleContext): FrameworkFinding[] {
        const findings: FrameworkFinding[] = [];
        const { pipeline } = context;

        const hasValidation = pipeline.preMiddleware.some(m => {
          const name = getMiddlewareName(m.node).toLowerCase();
          return name.includes('validate') || name.includes('validator') || name.includes('body') || name.includes('query') || name.includes('check');
        });

        if (!hasValidation) {
          findings.push(createFinding(
            this.metadata.id,
            'Express Route Missing Input Validation',
            `The route '${pipeline.path}' does not configure input validation middleware.`,
            'medium',
            context,
            'Apply validation middlewares (e.g. body(), query(), or custom validators) to check request parameters.'
          ));
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

function createFinding(
  ruleId: string,
  title: string,
  description: string,
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical',
  context: RuleContext,
  suggestedRemediation: string
): FrameworkFinding {
  return {
    id: '', // Will be stamped with unique sequence ID by the Security Engine
    ruleId,
    title,
    description,
    severity,
    confidence: 90,
    framework: 'Express',
    route: context.pipeline.path,
    handler: context.pipeline.handler,
    executionPipeline: context.pipeline,
    evidence: {
      summary: description,
      route: context.pipeline.path,
      relatedNodes: [context.pipeline.handler],
      relatedComponents: []
    },
    suggestedRemediation
  };
}
