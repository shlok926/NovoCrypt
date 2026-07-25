import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { Policy } from '../models/Policy';
import { RulePackRegistry } from '../registry/RulePackRegistry';

export class PolicyEvaluator {
  public static evaluate(
    finding: FrameworkFinding,
    activePolicy: Policy,
    policyMap: Map<string, Policy>,
    packRegistry: RulePackRegistry
  ): boolean {
    const merged = this.mergePolicyChain(activePolicy, policyMap);

    // 1. Enabled Rule Packs filter
    if (merged.enabledRulePacks.length > 0) {
      let isRuleInEnabledPacks = false;
      for (const packId of merged.enabledRulePacks) {
        const pack = packRegistry.getPack(packId);
        if (pack && pack.rules.includes(finding.ruleId)) {
          isRuleInEnabledPacks = true;
          break;
        }
      }
      if (!isRuleInEnabledPacks) return false;
    }

    // 2. Disabled Rules filter
    if (merged.disabledRules.includes(finding.ruleId)) {
      return false;
    }

    // 3. Confidence Threshold filter
    if (merged.confidenceThreshold !== undefined && finding.confidence < merged.confidenceThreshold) {
      return false;
    }

    // 4. Framework Filter
    if (merged.frameworkFilters && merged.frameworkFilters.length > 0) {
      if (!merged.frameworkFilters.includes(finding.framework)) {
        return false;
      }
    }

    return true;
  }

  public static mergePolicyChain(policy: Policy, policyMap: Map<string, Policy>): Policy {
    const chain: Policy[] = [];
    let current: Policy | undefined = policy;
    const visited = new Set<string>();

    while (current) {
      if (visited.has(current.id)) {
        // Circular inheritance protection
        break;
      }
      visited.add(current.id);
      chain.unshift(current); // Parent goes first so child values overwrite parent

      if (current.parentPolicyId) {
        current = policyMap.get(current.parentPolicyId);
      } else {
        current = undefined;
      }
    }

    // Accumulate configurations
    let enabledRulePacks: string[] = [];
    let disabledRules: string[] = [];
    const severityOverridesMap = new Map<string, string>();
    const complianceMappingsMap = new Map<string, any>();
    let confidenceThreshold = policy.confidenceThreshold; // Child wins by default
    let frameworkFilters: string[] = [];

    for (const p of chain) {
      enabledRulePacks.push(...p.enabledRulePacks);
      disabledRules.push(...p.disabledRules);
      
      for (const override of p.severityOverrides) {
        severityOverridesMap.set(override.ruleId, override.severity);
      }
      
      for (const map of p.complianceMappings) {
        complianceMappingsMap.set(`${map.ruleId}:${map.framework}:${map.mappedId}`, map);
      }

      if (p.confidenceThreshold !== undefined) {
        confidenceThreshold = p.confidenceThreshold;
      }

      if (p.frameworkFilters) {
        frameworkFilters.push(...p.frameworkFilters);
      }
    }

    return {
      id: policy.id,
      name: policy.name,
      description: policy.description,
      enabledRulePacks: Array.from(new Set(enabledRulePacks)),
      disabledRules: Array.from(new Set(disabledRules)),
      severityOverrides: Array.from(severityOverridesMap.entries()).map(([ruleId, severity]) => ({ ruleId, severity: severity as any })),
      complianceMappings: Array.from(complianceMappingsMap.values()),
      confidenceThreshold,
      frameworkFilters: frameworkFilters.length > 0 ? Array.from(new Set(frameworkFilters)) : undefined
    };
  }
}
