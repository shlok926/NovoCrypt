import { performance } from 'perf_hooks';
import { FrameworkMetadata } from '../../models/FrameworkMetadata';
import { FrameworkSemanticModel } from '../../semantic/models/FrameworkSemanticModel';
import { RequestExecutionPipeline } from '../../semantic/models/RequestExecutionPipeline';
import { CallGraph } from '../../../callgraph/CallGraph';
import { FlowGraph } from '../../../dataflow/FlowGraph';
import { FrameworkFinding } from '../models/FrameworkFinding';
import { RuleExecutionMetrics } from './RuleExecutionMetrics';
import { RuleContext } from './RuleContext';
import { FrameworkRuleRegistry } from '../registry/FrameworkRuleRegistry';
import { ExpressRulePack } from '../packs/ExpressRulePack';
import { FastifyRulePack } from '../packs/FastifyRulePack';
import { NestRulePack } from '../packs/NestRulePack';
import { KoaRulePack } from '../packs/KoaRulePack';
import { HapiRulePack } from '../packs/HapiRulePack';

export class FrameworkSecurityEngine {
  private registry = new FrameworkRuleRegistry();

  constructor() {
    this.registry.registerPack(new ExpressRulePack());
    this.registry.registerPack(new FastifyRulePack());
    this.registry.registerPack(new NestRulePack());
    this.registry.registerPack(new KoaRulePack());
    this.registry.registerPack(new HapiRulePack());
  }

  public evaluateSecurity(
    model: FrameworkSemanticModel,
    callGraph: CallGraph,
    dataFlow: FlowGraph,
    metadata: FrameworkMetadata
  ): { findings: FrameworkFinding[]; metrics: RuleExecutionMetrics } {
    const startTime = performance.now();
    const findings: FrameworkFinding[] = [];
    let evaluatedRoutesCount = 0;
    let skippedPipelinesCount = 0;

    for (const ctx of model.contexts) {
      const framework = ctx.framework;
      if (framework === 'Unknown') {
        skippedPipelinesCount++;
        continue;
      }

      evaluatedRoutesCount++;
      const rules = this.registry.getRulesForFramework(framework);

      const ruleCtx: RuleContext = {
        metadata,
        model,
        pipeline: ctx.pipeline,
        lifecycle: ctx.lifecycle,
        callGraph,
        dataFlow
      };

      for (const rule of rules) {
        try {
          const ruleFindings = rule.evaluate(ruleCtx);
          findings.push(...ruleFindings);
        } catch (e) {
          console.error(`Error executing rule ${rule.metadata.id}:`, e);
        }
      }
    }

    // Stamp findings with unique sequenced IDs
    const stampedFindings = findings.map((f, idx) => {
      return {
        ...f,
        id: `finding-${String(idx + 1).padStart(5, '0')}`
      };
    });

    const executionTimeMs = performance.now() - startTime;

    const metrics: RuleExecutionMetrics = {
      executionTimeMs,
      evaluatedRoutesCount,
      findingsCount: stampedFindings.length,
      skippedPipelinesCount
    };

    return { findings: stampedFindings, metrics };
  }
}
export { RuleContext };
