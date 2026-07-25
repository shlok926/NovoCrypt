import { Policy } from '../models/Policy';
import { RulePackRegistry } from '../registry/RulePackRegistry';
import { Suppression } from '../models/Suppression';

export class PolicyValidator {
  public static validate(
    policy: Policy,
    policyMap: Map<string, Policy>,
    packRegistry: RulePackRegistry
  ): void {
    const visited = new Set<string>();
    let current: Policy | undefined = policy;

    // 1. Circular inheritance check
    while (current) {
      if (visited.has(current.id)) {
        throw new Error(`Circular policy inheritance detected on policy ID '${current.id}'`);
      }
      visited.add(current.id);
      if (current.parentPolicyId) {
        current = policyMap.get(current.parentPolicyId);
      } else {
        current = undefined;
      }
    }

    // 2. Rule Pack validation
    for (const packId of policy.enabledRulePacks) {
      const pack = packRegistry.getPack(packId);
      if (!pack) {
        throw new Error(`Policy references unregistered rule pack ID '${packId}'`);
      }
    }

    // 3. Severity Override Validation
    for (const override of policy.severityOverrides) {
      if (!override.ruleId) {
        throw new Error('Severity override must specify ruleId');
      }
      if (!['info', 'low', 'medium', 'high', 'critical'].includes(override.severity)) {
        throw new Error(`Invalid override severity value: '${override.severity}'`);
      }
    }

    // 4. Compliance Mappings Validation
    for (const map of policy.complianceMappings) {
      if (!map.ruleId) {
        throw new Error('Compliance mapping must specify ruleId');
      }
      if (!['OWASP', 'CWE', 'CIS', 'NIST'].includes(map.framework)) {
        throw new Error(`Invalid compliance mapping framework: '${map.framework}'`);
      }
    }
  }

  public static validateSuppressions(suppressions: readonly Suppression[]): void {
    const ids = new Set<string>();
    for (const sup of suppressions) {
      if (!sup.id) {
        throw new Error('Suppression entry is missing unique id');
      }
      if (ids.has(sup.id)) {
        throw new Error(`Duplicate suppression ID detected: '${sup.id}'`);
      }
      ids.add(sup.id);

      if (!sup.justification) {
        throw new Error(`Suppression ${sup.id} must include a justification`);
      }
      if (!sup.ruleId && !sup.fingerprint && !sup.filePath && !sup.directory) {
        throw new Error(`Suppression ${sup.id} must specify at least one criteria (ruleId, fingerprint, filePath, or directory)`);
      }
    }
  }
}
