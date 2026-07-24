import * as crypto from 'crypto';
import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { DiagnosticModel } from './DiagnosticModel';
import { DiagnosticSeverity } from './DiagnosticSeverity';
import { DiagnosticCategory } from './DiagnosticCategory';

export class DiagnosticMapper {
  public static fromFinding(finding: FrameworkFinding): DiagnosticModel {
    const file = finding.executionPipeline.handler.metadata.get('filename') || 'unknown.ts';
    const startLine = finding.handler.location.startLine;
    const startColumn = finding.handler.location.startColumn || 1;
    const endLine = finding.handler.location.endLine || startLine;
    const endColumn = finding.handler.location.endColumn || startColumn;

    const hashInput = `${finding.ruleId}:${finding.route}:${startLine}:${file}`;
    const fingerprint = crypto.createHash('sha256').update(hashInput).digest('hex');

    return {
      id: finding.id || `novo-${fingerprint.substring(0, 12)}`,
      title: finding.title,
      description: finding.description,
      severity: this.mapFindingSeverity(finding.severity),
      category: this.mapFindingCategory(finding.title || ''),
      file: file.replace(/\\/g, '/'),
      startLine,
      startColumn,
      endLine,
      endColumn,
      ruleId: finding.ruleId,
      framework: finding.framework,
      confidence: finding.confidence,
      suggestedRemediation: finding.suggestedRemediation,
      fingerprint,
      source: 'NovoCrypt',
      relatedLocations: finding.evidence.relatedNodes.map(node => {
        const nodeFile = node.metadata.get('filename') || file;
        return {
          file: nodeFile.replace(/\\/g, '/'),
          line: node.location.startLine,
          column: node.location.startColumn || 1,
          message: 'Related evidence location'
        };
      })
    };
  }

  public static fromSarif(result: any, rulesList: readonly any[] = []): DiagnosticModel {
    const firstLoc = result.locations?.[0];
    const physLoc = firstLoc?.physicalLocation;
    const file = physLoc?.artifactLocation?.uri || 'unknown.ts';
    const region = physLoc?.region;
    
    const startLine = region?.startLine || 1;
    const startColumn = region?.startColumn || 1;
    const endLine = region?.endLine || startLine;
    const endColumn = region?.endColumn || startColumn;

    const ruleId = result.ruleId || 'unknown-rule';
    const ruleObj = rulesList.find(r => r.id === ruleId);
    
    const fingerprint = result.partialFingerprints?.['primaryLocationLineHash'] ||
      crypto.createHash('sha256').update(`${ruleId}:${file}:${startLine}`).digest('hex');

    const severity = this.mapSarifLevel(result.level);
    const category = this.mapFindingCategory(ruleObj?.properties?.category || '');

    return {
      id: result.id || `sarif-${fingerprint.substring(0, 12)}`,
      title: ruleObj?.name || ruleId,
      description: result.message?.text || 'No message provided',
      severity,
      category,
      file: file.replace(/\\/g, '/'),
      startLine,
      startColumn,
      endLine,
      endColumn,
      ruleId,
      framework: result.properties?.['novocrypt.framework'] || 'Unknown',
      confidence: result.properties?.['novocrypt.confidence'] || 100,
      suggestedRemediation: result.properties?.['novocrypt.suggestedRemediation'] || 'No remedy provided',
      fingerprint,
      source: 'SARIF',
      relatedLocations: []
    };
  }

  private static mapFindingSeverity(sev: 'info' | 'low' | 'medium' | 'high' | 'critical'): DiagnosticSeverity {
    switch (sev) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      case 'info':
        return 'hint';
      default:
        return 'warning';
    }
  }

  private static mapSarifLevel(level: string): DiagnosticSeverity {
    switch (level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'note':
        return 'info';
      case 'none':
        return 'hint';
      default:
        return 'warning';
    }
  }

  private static mapFindingCategory(text: string): DiagnosticCategory {
    const lower = text.toLowerCase();
    if (lower.includes('auth') || lower.includes('guard')) return 'Authentication';
    if (lower.includes('headers') || lower.includes('helmet')) return 'Headers';
    if (lower.includes('validation') || lower.includes('schema') || lower.includes('pipe')) return 'Validation';
    if (lower.includes('config') || lower.includes('order') || lower.includes('filter')) return 'Configuration';
    return 'Other';
  }
}
