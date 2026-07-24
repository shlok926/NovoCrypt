import { RuleMetadata } from '../../ast/framework/rules/models/RuleMetadata';
import { ReportingDescriptor } from '../schema/Rule';

export class SarifRuleMapper {
  public static mapRule(rule: RuleMetadata, includeHelp = true): ReportingDescriptor {
    return {
      id: rule.id,
      name: rule.name,
      shortDescription: {
        text: rule.name
      },
      fullDescription: {
        text: rule.description
      },
      helpUri: rule.references.length > 0 ? rule.references[0] : undefined,
      help: includeHelp ? {
        text: `Rule Category: ${rule.category}\nTags: ${rule.tags.join(', ')}`,
        markdown: `### Category\n${rule.category}\n\n### Tags\n${rule.tags.map(t => `\`${t}\``).join(', ')}\n\n### References\n${rule.references.map(r => `- [${r}](${r})`).join('\n')}`
      } : undefined,
      properties: {
        category: rule.category,
        tags: [...rule.tags],
        defaultSeverity: rule.severity,
        defaultEnabled: rule.defaultEnabled
      }
    };
  }
}
