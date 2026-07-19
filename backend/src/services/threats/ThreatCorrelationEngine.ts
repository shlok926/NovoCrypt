import { prisma } from '../../config/database';
import { AssetActivityService } from '../assets/AssetActivityService';

export class ThreatCorrelationEngine {
  /**
   * Run a correlation against the latest snapshot of an asset.
   */
  static async runCorrelation(assetId: string, workflowRunId?: string, jobId?: string) {
    // 1. Fetch Asset & Latest Snapshot
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || !asset.latestScanId) {
      throw new Error(`Asset ${assetId} has no scan data to correlate.`);
    }

    const latestScan = await prisma.scanResult.findUnique({ where: { id: asset.latestScanId } });
    if (!latestScan) throw new Error('Scan results not found');

    // 2. Initialize Correlation Record
    const correlation = await prisma.threatCorrelation.create({
      data: {
        assetId,
        workflowRunId,
        jobId,
        status: 'running',
        snapshotId: asset.latestScanId, // Ideally AssetSnapshot ID in real world
      }
    });

    try {
      // 3. Load Engine Data (Rules, Advisories)
      const rules = await prisma.threatRule.findMany();
      // NOTE: In a true prod env, we'd also load ThreatAdvisories and map them dynamically.
      
      const findings = latestScan.findings as any[];
      let overallPriority = 0;
      let highestSeverity = 'info';

      // 4. Evaluate Threat Rules & Generate Matches
      for (const finding of findings) {
        const algFamily = finding.algorithm || 'Unknown';
        
        // Evaluate against rules
        for (const rule of rules) {
          const condition = rule.condition as any;
          if (condition && condition.algorithmFamily === algFamily) {
            
            // Generate Match
            await prisma.threatMatch.create({
              data: {
                correlationId: correlation.id,
                algorithm: algFamily,
                algorithmFamily: algFamily,
                findingId: finding.id || 'N/A',
                threatSource: 'Internal Rule',
                ruleId: rule.id,
                confidence: 95,
                severity: rule.severity,
                impact: rule.description,
                affectedComponent: finding.fileName || finding.location,
              }
            });

            // Update correlation severity
            overallPriority = Math.max(overallPriority, rule.priority);
            if (rule.severity === 'critical') highestSeverity = 'critical';
            else if (rule.severity === 'high' && highestSeverity !== 'critical') highestSeverity = 'high';
          }
        }
      }

      // 5. Generate Recommendations based on Matches
      const matches = await prisma.threatMatch.findMany({ where: { correlationId: correlation.id }, include: { rule: true } });
      const uniqueRules = new Set(matches.map(m => m.rule?.id));

      for (const ruleId of uniqueRules) {
        if (!ruleId) continue;
        const ruleMatches = matches.filter(m => m.rule?.id === ruleId);
        const rule = ruleMatches[0].rule!;

        await prisma.threatRecommendation.create({
          data: {
            correlationId: correlation.id,
            recommendationType: 'Upgrade Algorithm',
            priority: rule.priority,
            title: `Replace ${ruleMatches[0].algorithmFamily}`,
            description: rule.recommendedAction,
            estimatedEffort: 'High',
            estimatedRiskReduction: rule.priority * 10,
          }
        });
      }

      // 6. Complete Correlation
      await prisma.threatCorrelation.update({
        where: { id: correlation.id },
        data: {
          status: 'completed',
          overallSeverity: highestSeverity,
          overallPriority,
          overallConfidence: 90,
        }
      });

      // 7. Publish Event to Asset Timeline
      await AssetActivityService.publishEvent({
        assetId,
        eventType: 'Threat Correlation Completed',
        title: `Intelligence Correlated`,
        description: `Correlated ${matches.length} threats. Highest severity: ${highestSeverity}. Generated ${uniqueRules.size} recommendations.`,
        severity: highestSeverity === 'high' ? 'warning' : highestSeverity as any,
        sourceModule: 'threat-intel',
        systemGenerated: true,
      });

      return correlation;

    } catch (error) {
      await prisma.threatCorrelation.update({
        where: { id: correlation.id },
        data: { status: 'failed' }
      });
      throw error;
    }
  }
}
