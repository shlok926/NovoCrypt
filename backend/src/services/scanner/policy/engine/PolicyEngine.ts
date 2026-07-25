import { performance } from 'perf_hooks';
import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { Policy } from '../models/Policy';
import { RuleProfile } from '../models/RuleProfile';
import { Suppression } from '../models/Suppression';
import { PolicyResult } from '../models/PolicyResult';
import { PolicyMetrics } from '../models/PolicyMetrics';
import { RulePackRegistry } from '../registry/RulePackRegistry';
import { PolicyRegistry } from '../registry/PolicyRegistry';
import { SuppressionEngine } from './SuppressionEngine';
import { SeverityEngine } from './SeverityEngine';
import { ComplianceEngine } from './ComplianceEngine';
import { PolicyEvaluator } from './PolicyEvaluator';

export class PolicyEngine {
  private packRegistry = new RulePackRegistry();
  private policyRegistry = new PolicyRegistry();

  public getPackRegistry(): RulePackRegistry {
    return this.packRegistry;
  }

  public getPolicyRegistry(): PolicyRegistry {
    return this.policyRegistry;
  }

  public evaluatePolicy(
    findings: readonly FrameworkFinding[],
    policyId: string,
    profile?: RuleProfile,
    suppressions: readonly Suppression[] = []
  ): PolicyResult {
    const startTime = performance.now();
    const policyMap = new Map<string, Policy>();
    this.policyRegistry.getAllPolicies().forEach(p => policyMap.set(p.id, p));

    const policy = policyMap.get(policyId);
    if (!policy) {
      throw new Error(`Policy with ID '${policyId}' is not registered`);
    }

    const mergedPolicy = PolicyEvaluator.mergePolicyChain(policy, policyMap);

    const governedFindings: FrameworkFinding[] = [];
    const suppressedFindings: FrameworkFinding[] = [];

    let rulesEvaluated = 0;
    let findingsSuppressed = 0;
    let overridesApplied = 0;
    let complianceMappingsAdded = 0;

    // Resolve profile values if present
    const minSeverity = profile ? profile.minimumSeverity : 'low';
    const confidenceThreshold = profile ? profile.confidenceThreshold : (mergedPolicy.confidenceThreshold || 0);
    const enabledRules = profile ? profile.enabledRules : undefined;

    for (const rawFinding of findings) {
      rulesEvaluated++;

      // Apply Profile Minimum Severity filter
      if (this.severityToValue(rawFinding.severity) < this.severityToValue(minSeverity)) {
        continue;
      }

      // Apply Profile Confidence threshold override
      if (rawFinding.confidence < confidenceThreshold) {
        continue;
      }

      // Apply Profile specific enabled rules
      if (enabledRules && !enabledRules.includes(rawFinding.ruleId)) {
        continue;
      }

      // Apply policy evaluator rules
      const policyPass = PolicyEvaluator.evaluate(
        rawFinding,
        mergedPolicy,
        policyMap,
        this.packRegistry
      );
      if (!policyPass) {
        continue;
      }

      // Check suppressions
      const supCheck = SuppressionEngine.isSuppressed(rawFinding, suppressions);
      if (supCheck.suppressed) {
        findingsSuppressed++;
        const suppressedClone = {
          ...rawFinding,
          suppressionJustification: supCheck.justification
        };
        suppressedFindings.push(suppressedClone as any);
        continue;
      }

      // Apply severity overrides
      const overrideResult = SeverityEngine.applyOverrides(rawFinding, mergedPolicy.severityOverrides);
      let findingToRegister = overrideResult.finding;
      if (overrideResult.applied) {
        overridesApplied++;
      }

      // Apply compliance mappings
      const complianceResult = ComplianceEngine.resolveCompliance(
        findingToRegister,
        mergedPolicy.complianceMappings
      );
      findingToRegister = complianceResult.finding;
      complianceMappingsAdded += complianceResult.count;

      governedFindings.push(findingToRegister);
    }

    const evaluationTimeMs = performance.now() - startTime;

    const metrics: PolicyMetrics = {
      rulesEvaluated,
      findingsSuppressed,
      overridesApplied,
      complianceMappingsAdded,
      evaluationTimeMs,
      policiesLoaded: policyMap.size
    };

    return {
      findings: governedFindings,
      suppressed: suppressedFindings,
      metrics
    };
  }

  private severityToValue(sev: 'info' | 'low' | 'medium' | 'high' | 'critical'): number {
    switch (sev) {
      case 'info': return 0;
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      case 'critical': return 4;
      default: return 0;
    }
  }
}
export { PolicyResult, PolicyMetrics };
