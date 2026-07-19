import { prisma } from '../../config/database';
import { AssetActivityService } from '../assets/AssetActivityService';

export class MigrationEngine {
  /**
   * Generates a complete Post-Quantum Migration Plan based on correlations.
   */
  static async planMigration(assetId: string, workflowRunId?: string, jobId?: string) {
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error(`Asset ${assetId} not found`);

    // 1. Load latest Threat Correlation
    const correlation = await prisma.threatCorrelation.findFirst({
      where: { assetId },
      orderBy: { correlatedAt: 'desc' },
      include: {
        matches: true,
        recommendations: true
      }
    });

    if (!correlation || correlation.recommendations.length === 0) {
      throw new Error(`Asset ${assetId} has no threat recommendations to plan against.`);
    }

    // 2. Initialize Migration Plan
    const plan = await prisma.migrationPlan.create({
      data: {
        assetId,
        workflowRunId,
        status: 'draft',
        overallPriority: correlation.overallPriority,
        businessPriority: 50, // Default for now
      }
    });

    try {
      // 3. Create Default Phases
      const phase1 = await prisma.migrationPhase.create({
        data: {
          migrationPlanId: plan.id,
          phaseOrder: 1,
          title: 'Discovery & Preparation',
          status: 'pending'
        }
      });

      const phase2 = await prisma.migrationPhase.create({
        data: {
          migrationPlanId: plan.id,
          phaseOrder: 2,
          title: 'Algorithm Upgrade & Remediation',
          status: 'pending'
        }
      });

      let totalEffort = 0;
      let totalRiskReduction = 0;

      // 4. Generate Tasks from Threat Recommendations
      for (const rec of correlation.recommendations) {
        // Map effort
        const effortMap: Record<string, number> = { 'Low': 4, 'Medium': 24, 'High': 80 };
        const hours = effortMap[rec.estimatedEffort] || 40;
        
        // Hardcode a simple recommendation map for now
        let currentTech = 'Legacy';
        let recommendedTech = 'PQC Standard';
        
        if (rec.title.includes('RSA')) { currentTech = 'RSA'; recommendedTech = 'ML-KEM'; }
        else if (rec.title.includes('ECC')) { currentTech = 'ECC'; recommendedTech = 'ML-DSA'; }
        
        await prisma.migrationTask.create({
          data: {
            migrationPlanId: plan.id,
            migrationPhaseId: phase2.id,
            taskType: rec.recommendationType,
            title: rec.title,
            description: rec.description,
            currentTechnology: currentTech,
            recommendedTechnology: recommendedTech,
            priority: rec.priority,
            status: 'pending',
            estimatedHours: hours,
            complexity: rec.estimatedEffort,
          }
        });

        totalEffort += hours;
        totalRiskReduction += rec.estimatedRiskReduction;
      }

      // 5. Calculate overall estimates
      await prisma.migrationPlan.update({
        where: { id: plan.id },
        data: {
          status: 'active',
          estimatedEngineeringEffort: totalEffort,
          estimatedDurationDays: Math.ceil(totalEffort / 8),
          estimatedRiskReduction: totalRiskReduction,
          technicalPriority: Math.min(100, Math.round(totalRiskReduction / 2)),
        }
      });

      // 6. Publish Timeline Event
      await AssetActivityService.publishEvent({
        assetId,
        eventType: 'Migration Plan Generated',
        title: `Strategic Migration Roadmap Created`,
        description: `Generated roadmap with ${correlation.recommendations.length} tasks. Estimated Effort: ${totalEffort} hours.`,
        severity: 'warning',
        sourceModule: 'migration',
        systemGenerated: true,
      });

      return plan;
    } catch (error) {
      await prisma.migrationPlan.update({
        where: { id: plan.id },
        data: { status: 'failed' }
      });
      throw error;
    }
  }
}
