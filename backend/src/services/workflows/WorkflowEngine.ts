import { prisma } from '../../config/database';
import { QueueService, QueueName } from '../jobs/QueueService';
import { AssetActivityService } from '../assets/AssetActivityService';

export class WorkflowEngine {
  
  /**
   * Start a workflow run for an asset
   */
  static async startWorkflow(workflowId: string, assetId: string, userId: string, initialPayload: any) {
    // 1. Fetch workflow template with steps ordered by stepOrder
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        }
      }
    });

    if (!workflow || !workflow.enabled) {
      throw new Error(`Workflow ${workflowId} not found or is disabled.`);
    }

    if (workflow.steps.length === 0) {
      throw new Error(`Workflow ${workflowId} has no steps configured.`);
    }

    // 2. Create Workflow Run
    const run = await prisma.workflowRun.create({
      data: {
        workflowId,
        assetId,
        requestedByUserId: userId,
        status: 'running',
        startedAt: new Date(),
        currentStep: workflow.steps[0].stepOrder,
      }
    });

    // 3. Publish Timeline Event
    await AssetActivityService.publishEvent({
      assetId,
      eventType: 'Workflow Started',
      title: `${workflow.workflowName} Started`,
      description: `Workflow Run ${run.id} initiated.`,
      severity: 'info',
      sourceModule: 'system',
      createdByUserId: userId,
    });

    // 4. Trigger first step
    await this.executeStep(run.id, workflow.steps[0].id, initialPayload);

    return run;
  }

  /**
   * Internal executor for a specific step
   */
  private static async executeStep(workflowRunId: string, workflowStepId: string, payload: any) {
    const step = await prisma.workflowStep.findUnique({ where: { id: workflowStepId } });
    if (!step) throw new Error('WorkflowStep not found');

    const run = await prisma.workflowRun.findUnique({ where: { id: workflowRunId } });
    if (!run) throw new Error('WorkflowRun not found');

    // Merge configuration from the workflow step template with the dynamic payload
    const mergedPayload = { ...payload, ...(step.configuration as Record<string, any> || {}) };

    // Queue the Job dynamically based on step type
    let targetQueue: QueueName;
    switch (step.stepType) {
      case 'scan': targetQueue = 'scanner'; break;
      case 'report': targetQueue = 'reports'; break;
      case 'compliance': targetQueue = 'compliance'; break;
      case 'ai': targetQueue = 'ai'; break;
      case 'correlation': targetQueue = 'correlation'; break;
      case 'migration': targetQueue = 'migration'; break;
      default: targetQueue = 'scanner';
    }

    // Enqueue the job using the existing Job Engine
    const job = await QueueService.enqueue(
      targetQueue,
      step.jobType,
      mergedPayload,
      { assetId: run.assetId || undefined, requestedByUserId: run.requestedByUserId || undefined }
    );

    // Record the execution
    await prisma.workflowStepExecution.create({
      data: {
        workflowRunId,
        workflowStepId,
        jobId: job.id,
        status: 'running',
        startedAt: new Date(),
      }
    });

    // Update run progress
    await prisma.workflowRun.update({
      where: { id: workflowRunId },
      data: { currentStep: step.stepOrder }
    });
  }

  /**
   * Hook for the Job Worker to call when a job completes
   * This advances the workflow to the next step.
   */
  static async handleJobCompletion(jobId: string) {
    // 1. Find if this job is part of a workflow step execution
    const execution = await prisma.workflowStepExecution.findUnique({
      where: { jobId },
      include: {
        run: {
          include: {
            workflow: {
              include: { steps: { orderBy: { stepOrder: 'asc' } } }
            },
            asset: true
          }
        },
        step: true
      }
    });

    if (!execution) return; // Independent job, not part of a workflow

    // 2. Mark this step execution as completed
    await prisma.workflowStepExecution.update({
      where: { id: execution.id },
      data: { status: 'completed', completedAt: new Date() }
    });

    const run = execution.run;
    const allSteps = run.workflow.steps;
    
    // 3. Determine Next Step
    const currentStepIndex = allSteps.findIndex(s => s.id === execution.step.id);
    const nextStep = allSteps[currentStepIndex + 1];

    if (nextStep) {
      // 4. Progress to next step
      const nextProgress = Math.floor(((currentStepIndex + 1) / allSteps.length) * 100);
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { progress: nextProgress }
      });

      // Pass previous job's output payload to the next step (Placeholder - in reality would query job result)
      const nextPayload = {}; 
      await this.executeStep(run.id, nextStep.id, nextPayload);
    } else {
      // 5. Workflow Completed
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: 'completed', completedAt: new Date(), progress: 100 }
      });

      if (run.assetId) {
        await AssetActivityService.publishEvent({
          assetId: run.assetId,
          eventType: 'Workflow Completed',
          title: `${run.workflow.workflowName} Completed`,
          description: `Workflow Run ${run.id} finished successfully.`,
          severity: 'info',
          sourceModule: 'system',
          createdByUserId: run.requestedByUserId || undefined,
        });
      }
    }
  }

  /**
   * Hook for Job Worker to call when a job fails
   */
  static async handleJobFailure(jobId: string, errorMessage: string) {
    const execution = await prisma.workflowStepExecution.findUnique({
      where: { jobId },
      include: { run: { include: { workflow: true } } }
    });

    if (!execution) return;

    await prisma.workflowStepExecution.update({
      where: { id: execution.id },
      data: { status: 'failed', errorMessage }
    });

    await prisma.workflowRun.update({
      where: { id: execution.workflowRunId },
      data: { status: 'failed', failedAt: new Date() }
    });

    if (execution.run.assetId) {
      await AssetActivityService.publishEvent({
        assetId: execution.run.assetId,
        eventType: 'Workflow Failed',
        title: `${execution.run.workflow.workflowName} Failed`,
        description: `Step failed: ${errorMessage}`,
        severity: 'critical',
        sourceModule: 'system',
        createdByUserId: execution.run.requestedByUserId || undefined,
      });
    }
  }
}
