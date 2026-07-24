import * as crypto from 'crypto';
import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { Result } from '../schema/Result';
import { SarifLocationMapper } from './SarifLocationMapper';

export class SarifResultMapper {
  public static mapFinding(
    finding: FrameworkFinding,
    ruleIndex?: number,
    baseUri?: string,
    includeProperties = true
  ): Result {
    const filename = finding.executionPipeline.handler.metadata.get('filename') || 'unknown.ts';
    const primaryLocation = SarifLocationMapper.mapLocation(finding.handler, filename, baseUri);

    const level = this.getSarifLevel(finding.severity);

    // Compute deterministic fingerprint
    const hashInput = `${finding.ruleId}:${finding.route}:${primaryLocation.physicalLocation.region?.startLine || 0}:${filename}`;
    const fingerprint = crypto.createHash('sha256').update(hashInput).digest('hex');

    const result: Result = {
      ruleId: finding.ruleId,
      ruleIndex,
      message: {
        text: finding.description,
        markdown: `### Issue\n${finding.description}\n\n### Suggested Remediation\n${finding.suggestedRemediation}`
      },
      level,
      locations: [primaryLocation],
      partialFingerprints: {
        'primaryLocationLineHash': fingerprint,
        'ruleLocationHash': fingerprint
      }
    };

    if (includeProperties) {
      (result as any).properties = {
        'novocrypt.confidence': finding.confidence,
        'novocrypt.framework': finding.framework,
        'novocrypt.suggestedRemediation': finding.suggestedRemediation
      };
    }

    return result;
  }

  private static getSarifLevel(severity: 'info' | 'low' | 'medium' | 'high' | 'critical'): 'none' | 'note' | 'warning' | 'error' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      case 'info':
        return 'note';
      default:
        return 'warning';
    }
  }
}
