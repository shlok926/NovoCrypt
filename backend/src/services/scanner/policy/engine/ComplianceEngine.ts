import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { ComplianceMapping } from '../models/ComplianceMapping';
import { OWASPMapping } from '../compliance/OWASPTop10';
import { CWEMapping } from '../compliance/CWE';
import { CISMapping } from '../compliance/CIS';
import { NIST80053Mapping } from '../compliance/NIST80053';

export class ComplianceEngine {
  public static resolveCompliance(
    finding: FrameworkFinding,
    customMappings: readonly ComplianceMapping[] = []
  ): { finding: FrameworkFinding; count: number } {
    const tags = new Set<string>();

    const owasp = OWASPMapping[finding.ruleId];
    if (owasp) tags.add(`OWASP:${owasp}`);

    const cwe = CWEMapping[finding.ruleId];
    if (cwe) tags.add(`CWE:${cwe}`);

    const cis = CISMapping[finding.ruleId];
    if (cis) tags.add(`CIS:${cis}`);

    const nist = NIST80053Mapping[finding.ruleId];
    if (nist) tags.add(`NIST:${nist}`);

    // Map custom policies compliance mappings
    for (const mapping of customMappings) {
      if (mapping.ruleId === finding.ruleId) {
        tags.add(`${mapping.framework}:${mapping.mappedId}`);
      }
    }

    const tagsArray = Array.from(tags);

    const updatedFinding = {
      ...finding,
      compliance: tagsArray
    };

    return {
      finding: updatedFinding as any,
      count: tagsArray.length
    };
  }
}
