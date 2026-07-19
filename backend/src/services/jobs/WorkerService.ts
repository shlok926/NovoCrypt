import { Worker, Job as BullJob } from 'bullmq';
import IORedis from 'ioredis';
import { QueueService } from './QueueService';
import { scannerEngine } from '../scanner';
import { prisma } from '../../config/database';
import { AssetActivityService } from '../assets/AssetActivityService';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export class WorkerService {
  private static scannerWorker: Worker;

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
          
          // Execute core logic
          const result = await scannerEngine.runScan({
            targetType: payload.targetType,
            target: payload.target,
            fileName: payload.fileName,
          });

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
          await QueueService.markJobFailed(dbJobId, error instanceof Error ? error.message : 'Unknown error');
          
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
    
    console.log('👷 Workers initialized successfully.');
  }
}
