import { FrameworkFinding } from '../../ast/framework/rules/models/FrameworkFinding';
import { RuleExecutionMetrics } from '../../ast/framework/rules/engine/RuleExecutionMetrics';
import { SarifReport } from '../schema/SarifSchema';
import { Run } from '../schema/Run';
import { ReportingDescriptor } from '../schema/Rule';
import { Result } from '../schema/Result';
import { FrameworkRuleRegistry } from '../../ast/framework/rules/registry/FrameworkRuleRegistry';
import { FrameworkRule } from '../../ast/framework/rules/registry/RulePack';
import { ExpressRulePack } from '../../ast/framework/rules/packs/ExpressRulePack';
import { FastifyRulePack } from '../../ast/framework/rules/packs/FastifyRulePack';
import { NestRulePack } from '../../ast/framework/rules/packs/NestRulePack';
import { KoaRulePack } from '../../ast/framework/rules/packs/KoaRulePack';
import { HapiRulePack } from '../../ast/framework/rules/packs/HapiRulePack';
import { SarifRuleMapper } from '../mapper/SarifRuleMapper';
import { SarifResultMapper } from '../mapper/SarifResultMapper';
import { SarifArtifactMapper } from '../mapper/SarifArtifactMapper';
import { SarifRunMetadata } from './SarifRunMetadata';


export interface SarifExporterOptions {
  includeArtifacts?: boolean;
  includeLogicalLocations?: boolean;
  includeRuleHelp?: boolean;
  includeProperties?: boolean;
  prettyPrint?: boolean;
  baseUri?: string;
}

export class SarifBuilder {
  private registry = new FrameworkRuleRegistry();
  private metadata = new SarifRunMetadata();

  constructor() {
    this.registry.registerPack(new ExpressRulePack());
    this.registry.registerPack(new FastifyRulePack());
    this.registry.registerPack(new NestRulePack());
    this.registry.registerPack(new KoaRulePack());
    this.registry.registerPack(new HapiRulePack());
  }

  public buildReport(
    findings: readonly FrameworkFinding[],
    metrics: RuleExecutionMetrics,
    options: SarifExporterOptions = {}
  ): SarifReport {
    const rulesMap = new Map<string, ReportingDescriptor>();
    const allRules = this.registry.getAllRules();

    // Map all referenced rules
    const referencedRuleIds = new Set(findings.map(f => f.ruleId));
    const driverRules: ReportingDescriptor[] = [];
    
    allRules.forEach((rule: FrameworkRule) => {
      if (referencedRuleIds.has(rule.metadata.id)) {
        const sarifRule = SarifRuleMapper.mapRule(rule.metadata, options.includeRuleHelp !== false);
        rulesMap.set(rule.metadata.id, sarifRule);
        driverRules.push(sarifRule);
      }
    });

    const ruleIdToIndex = new Map<string, number>();
    driverRules.forEach((rule, idx) => {
      ruleIdToIndex.set(rule.id, idx);
    });

    // Map results
    const results: Result[] = findings.map(finding => {
      const ruleIndex = ruleIdToIndex.get(finding.ruleId);
      return SarifResultMapper.mapFinding(
        finding,
        ruleIndex,
        options.baseUri,
        options.includeProperties !== false
      );
    });

    // Map artifacts
    const artifacts = options.includeArtifacts !== false
      ? SarifArtifactMapper.mapArtifacts(findings, options.baseUri)
      : undefined;

    const run: Run = {
      tool: {
        driver: {
          name: this.metadata.toolName,
          version: this.metadata.toolVersion,
          informationUri: this.metadata.informationUri,
          rules: driverRules
        }
      },
      results,
      artifacts,
      properties: this.metadata.buildRunProperties(metrics)
    };

    return {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [run]
    };
  }
}
export { FrameworkRuleRegistry };
