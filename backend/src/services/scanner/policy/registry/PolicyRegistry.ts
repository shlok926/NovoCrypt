import { Policy } from '../models/Policy';

export class PolicyRegistry {
  private policies = new Map<string, Policy>();

  public registerPolicy(policy: Policy): void {
    this.policies.set(policy.id, policy);
  }

  public getPolicy(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  public getAllPolicies(): readonly Policy[] {
    return Array.from(this.policies.values());
  }

  public removePolicy(policyId: string): void {
    this.policies.delete(policyId);
  }

  public clear(): void {
    this.policies.clear();
  }
}
