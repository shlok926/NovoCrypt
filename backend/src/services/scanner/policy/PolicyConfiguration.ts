import { Policy } from './models/Policy';
import { RulePackRegistry } from './registry/RulePackRegistry';
import { PolicyRegistry } from './registry/PolicyRegistry';
import { PolicyValidator } from './validation/PolicyValidator';

export class PolicyConfiguration {
  constructor(
    private policyRegistry: PolicyRegistry,
    private packRegistry: RulePackRegistry
  ) {}

  public loadPolicies(policies: readonly Policy[]): void {
    const policyMap = new Map<string, Policy>();
    
    for (const p of policies) {
      policyMap.set(p.id, p);
    }

    // Validate policies first
    for (const p of policies) {
      PolicyValidator.validate(p, policyMap, this.packRegistry);
    }

    // Register all validated policies
    this.policyRegistry.clear();
    for (const p of policies) {
      this.policyRegistry.registerPolicy(p);
    }
  }
}
