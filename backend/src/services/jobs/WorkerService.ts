import { Worker, Job as BullJob } from 'bullmq';
import IORedis from 'ioredis';
import { QueueService } from './QueueService';
import { scannerEngine } from '../scanner';
import { prisma } from '../../config/database';
import { AssetActivityService } from '../assets/AssetActivityService';
import { ThreatCorrelationEngine } from '../threats/ThreatCorrelationEngine';
import { MigrationEngine } from '../migrations/MigrationEngine';
import { TargetAcquisitionService } from '../scanner/acquisition/TargetAcquisitionService';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export class WorkerService {
  private static scannerWorker: Worker;
  private static correlationWorker: Worker;
  private static migrationWorker: Worker;
  private static reportsWorker: Worker;

  static initializeWorkers() {
    this.scannerWorker = new Worker(
      'scanner',
      async (bullJob: BullJob) => {
        const { dbJobId, payload } = bullJob.data;
        
        await QueueService.markJobStarted(dbJobId);
        await QueueService.updateJobProgress(dbJobId, 10, 'Initializing Engine');

        const dbJob = await prisma.job.findUnique({ where: { id: dbJobId } });
        if (dbJob?.assetId) {
          await AssetActivityService.publishEvent({
            assetId: dbJob.assetId,
            eventType: 'Job Started',
            title: `Job execution started`,
            description: `Worker picked up job ${dbJobId}`,
            severity: 'info',
            sourceModule: 'scanner',
          });
        }

        try {
          await QueueService.updateJobProgress(dbJobId, 30, 'Running Detectors');
          
          let result;

          if (payload.targetType === 'git' || payload.targetType === 'local') {
            // Enterprise Target Acquisition Flow
            const acquisition = new TargetAcquisitionService();
            const { files, cleanup } = await acquisition.acquire(dbJobId, payload.targetType, payload.target);
            try {
              result = await scannerEngine.runEnterpriseScan(files, 'code');
            } finally {
              await cleanup();
            }
          } else {
            // Fallback for original raw-string payloads
            result = await scannerEngine.runScan({
              targetType: payload.targetType,
              target: payload.target,
              fileName: payload.fileName,
            });
          }

          await QueueService.updateJobProgress(dbJobId, 80, 'Finalizing Results');

          // Process and persist results
          if (dbJob?.assetId) {
            const scan = await prisma.scanResult.create({
              data: {
                userId: dbJob.requestedByUserId || 'system',
                assetId: dbJob.assetId,
                scanType: payload.targetType,
                inputTarget: payload.target,
                findings: result.findings as any,
                overallScore: result.overallRiskScore,
                riskLevel: result.riskLevel,
              }
            });

            await prisma.asset.update({
              where: { id: dbJob.assetId },
              data: {
                latestScanId: scan.id,
                lastScanAt: scan.scannedAt,
                currentRiskScore: scan.overallScore,
                currentQuantumReadiness: result.quantumReadinessScore
              }
            });

            await AssetActivityService.publishSnapshot({
              assetId: dbJob.assetId,
              scanResultId: scan.id,
              overallRiskScore: scan.overallScore,
              quantumReadinessScore: result.quantumReadinessScore,
              findings: result.findings as any
            });

            await AssetActivityService.publishEvent({
              assetId: dbJob.assetId,
              eventType: 'Job Completed',
              title: 'Scan Job Completed',
              description: `Risk Score ${scan.overallScore}. Findings: ${result.findings.length}`,
              severity: scan.overallScore < 50 ? 'critical' : 'info',
              sourceModule: 'scanner',
            });
          }

          await QueueService.markJobCompleted(dbJobId);
          return result;
        } catch (error) {
          console.error(`Job ${dbJobId} failed:`, error);
          await QueueService.handleJobException(dbJobId, error, bullJob);
          
          if (dbJob?.assetId) {
             await AssetActivityService.publishEvent({
              assetId: dbJob.assetId,
              eventType: 'Job Failed',
              title: 'Scan Job Failed',
              description: error instanceof Error ? error.message : 'Unknown error',
              severity: 'critical',
              sourceModule: 'scanner',
            });
          }
          throw error;
        }
      },
      { connection, concurrency: 5 } // Allow 5 concurrent scanner jobs
    );

    this.scannerWorker.on('failed', (job, err) => {
      console.error(`${job?.id} has failed with ${err.message}`);
    });

    this.correlationWorker = new Worker(
      'correlation',
      async (bullJob: BullJob) => {
        const { dbJobId, payload } = bullJob.data;
        const dbJob = await prisma.job.findUnique({ where: { id: dbJobId } });
        
        await QueueService.markJobStarted(dbJobId);
        await QueueService.updateJobProgress(dbJobId, 20, 'Loading Threat Intelligence');

        try {
          if (!dbJob?.assetId) throw new Error('assetId is required for Threat Correlation');
          
          await QueueService.updateJobProgress(dbJobId, 50, 'Evaluating Rules & Generating Matches');
          await ThreatCorrelationEngine.runCorrelation(dbJob.assetId, payload.workflowRunId, dbJobId);

          await QueueService.updateJobProgress(dbJobId, 90, 'Publishing Recommendations');
          await QueueService.markJobCompleted(dbJobId);
          return { success: true };
        } catch (error) {
          console.error(`Correlation Job ${dbJobId} failed:`, error);
          await QueueService.handleJobException(dbJobId, error, bullJob);
          throw error;
        }
      },
      { connection, concurrency: 2 }
    );
    
    this.migrationWorker = new Worker(
      'migration',
      async (bullJob: BullJob) => {
        const { dbJobId, payload } = bullJob.data;
        const dbJob = await prisma.job.findUnique({ where: { id: dbJobId } });
        
        await QueueService.markJobStarted(dbJobId);
        await QueueService.updateJobProgress(dbJobId, 20, 'Loading Asset & Correlation Data');

        try {
          if (!dbJob?.assetId) throw new Error('assetId is required for Migration Planning');
          
          await QueueService.updateJobProgress(dbJobId, 50, 'Evaluating Migration Rules');
          await MigrationEngine.planMigration(dbJob.assetId, payload.workflowRunId, dbJobId);

          await QueueService.updateJobProgress(dbJobId, 90, 'Generating Strategic Roadmap');
          await QueueService.markJobCompleted(dbJobId);
          return { success: true };
        } catch (error) {
          console.error(`Migration Job ${dbJobId} failed:`, error);
          await QueueService.handleJobException(dbJobId, error, bullJob);
          throw error;
        }
      },
      { connection, concurrency: 2 }
    );
    
    this.reportsWorker = new Worker(
      'reports',
      async (bullJob: BullJob) => {
        const { dbJobId, payload } = bullJob.data;
        const dbJob = await prisma.job.findUnique({ where: { id: dbJobId } });
        
        await QueueService.markJobStarted(dbJobId);
        await QueueService.updateJobProgress(dbJobId, 10, 'Initializing Report Engine');

        try {
          // Dynamic import to avoid circular dependencies if any
          const { reportEngine } = await import('../reporting-engine/index');
          
          await QueueService.updateJobProgress(dbJobId, 30, 'Fetching Assessment Data');
          
          let startDate = new Date();
          const { dateRange, modules, userId, organizationName } = payload;
          if (dateRange === '7d') startDate.setDate(startDate.getDate() - 7);
          else if (dateRange === '30d') startDate.setDate(startDate.getDate() - 30);
          else if (dateRange === '90d') startDate.setDate(startDate.getDate() - 90);
          else startDate = new Date(0);

          await QueueService.updateJobProgress(dbJobId, 50, 'Building PDF Sections');
          
          const buffer = await reportEngine.generateReportBuffer({
            userId,
            organizationName: organizationName || 'NovoCrypt Customer',
            reportPeriod: `Last ${dateRange.replace('d', ' Days')}`,
            startDate,
            endDate: new Date(),
            enabledModules: modules,
            cache: new Map()
          });

          await QueueService.updateJobProgress(dbJobId, 80, 'Saving Report File');
          
          // Generate a report record or save buffer to storage.
          // For now, we will store the base64 encoded buffer in the Job's result payload
          // In a real system, we'd upload this to S3 and save the URL.
          const base64Pdf = buffer.toString('base64');
          
          await prisma.job.update({
            where: { id: dbJobId },
            data: { resultPayload: { base64Pdf, filename: `Executive-Security-Report-${new Date().toISOString().split('T')[0]}.pdf` } }
          });

          await QueueService.updateJobProgress(dbJobId, 100, 'Report Ready');
          await QueueService.markJobCompleted(dbJobId);
          return { success: true };
        } catch (error) {
          console.error(`Report Job ${dbJobId} failed:`, error);
          await QueueService.handleJobException(dbJobId, error, bullJob);
          throw error;
        }
      },
      { connection, concurrency: 2 } // CPU intensive
    );

    console.log('👷 Workers initialized successfully.');
  }
}
