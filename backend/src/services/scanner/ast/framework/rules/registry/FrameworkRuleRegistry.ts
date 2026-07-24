import { FrameworkType } from '../../models/FrameworkModel';
import { RulePack, FrameworkRule } from './RulePack';

export class FrameworkRuleRegistry {
  private packs: RulePack[] = [];

  public registerPack(pack: RulePack): void {
    this.packs.push(pack);
  }

  public getRulesForFramework(framework: FrameworkType): FrameworkRule[] {
    const rules: FrameworkRule[] = [];
    for (const pack of this.packs) {
      for (const rule of pack.rules) {
        if (rule.metadata.supportedFrameworks.includes(framework) && rule.metadata.defaultEnabled) {
          rules.push(rule);
        }
      }
    }
    return rules;
  }

  public getAllRules(): FrameworkRule[] {
    const rules: FrameworkRule[] = [];
    for (const pack of this.packs) {
      rules.push(...pack.rules);
    }
    return rules;
  }

  public clear(): void {
    this.packs = [];
  }
}
