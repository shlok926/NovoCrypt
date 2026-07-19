import { Queue, Worker, Job as BullJob, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '../../config/database';
import { AssetActivityService } from '../assets/AssetActivityService';
import { WorkflowEngine } from '../workflows/WorkflowEngine';

// Redis connection string (should come from env in production)
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

export type QueueName = 'scanner' | 'reports' | 'ai' | 'compliance';

// Registry of queues
const queues: Record<string, Queue> = {
  scanner: new Queue('scanner', { connection }),
  reports: new Queue('reports', { connection }),
  ai: new Queue('ai', { connection }),
  compliance: new Queue('compliance', { connection }),
};

export class QueueService {
  /**
   * Enqueue a generic job
   */
  static async enqueue(
    queueName: QueueName,
    jobType: string,
    payload: any,
    options: { assetId?: string; requestedByUserId?: string; priority?: number } = {}
  ) {
    // 1. Create DB Job Record
    const dbJob = await prisma.job.create({
      data: {
        jobType,
        jobStatus: 'queued',
        queueName,
        payload,
        assetId: options.assetId,
        requestedByUserId: options.requestedByUserId,
        priority: options.priority || 0,
      },
    });

    // 2. Add to BullMQ
    await queues[queueName].add(jobType, { dbJobId: dbJob.id, payload }, {
      jobId: dbJob.id, // Keep IDs synced
      priority: options.priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    // 3. Publish Timeline Event if Asset-linked
    if (options.assetId) {
      await AssetActivityService.publishEvent({
        assetId: options.assetId,
        eventType: 'Job Queued',
        title: `${jobType} Job Queued`,
        description: `Job ${dbJob.id} added to ${queueName} queue.`,
        severity: 'info',
        sourceModule: 'system',
        createdByUserId: options.requestedByUserId,
      });
    }

    return dbJob;
  }

  static async getJobStatus(jobId: string) {
    return prisma.job.findUnique({ where: { id: jobId } });
  }

  static async updateJobProgress(jobId: string, progress: number, stage: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: { progress, currentStage: stage, updatedAt: new Date() },
    });
  }

  static async markJobStarted(jobId: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: { jobStatus: 'running', startedAt: new Date() },
    });
  }

  static async markJobCompleted(jobId: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: { jobStatus: 'completed', completedAt: new Date(), progress: 100, currentStage: 'Completed' },
    });

    // Notify Workflow Engine
    await WorkflowEngine.handleJobCompletion(jobId).catch(err => console.error('Workflow completion hook error:', err));
  }

  static async markJobFailed(jobId: string, errorMessage: string) {
    await prisma.job.update({
      where: { id: jobId },
      data: { jobStatus: 'failed', failedAt: new Date(), errorMessage },
    });

    // Notify Workflow Engine
    await WorkflowEngine.handleJobFailure(jobId, errorMessage).catch(err => console.error('Workflow failure hook error:', err));
  }
}
