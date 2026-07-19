import { api } from '../lib/api';
import { Job } from './jobs';

export interface WorkflowStep {
  id: string;
  workflowId: string;
  stepOrder: number;
  stepType: string;
  displayName: string;
  jobType: string;
  configuration?: any;
}

export interface Workflow {
  id: string;
  workflowName: string;
  workflowType: string;
  description?: string;
  version: string;
  enabled: boolean;
  steps: WorkflowStep[];
  createdAt: string;
}

export interface WorkflowStepExecution {
  id: string;
  workflowRunId: string;
  workflowStepId: string;
  jobId?: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  step: WorkflowStep;
  job?: Job;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  assetId?: string;
  status: string;
  currentStep: number;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  workflow: Workflow;
  stepExecutions: WorkflowStepExecution[];
}

export const workflowApi = {
  listTemplates(): Promise<{ data: Workflow[] }> {
    return api.get('/workflows').then(res => res.data);
  },
  runWorkflow(workflowId: string, assetId: string, payload: any = {}): Promise<{ data: { runId: string } }> {
    return api.post(`/workflows/${workflowId}/run`, { assetId, payload }).then(res => res.data);
  },
  getRun(runId: string): Promise<{ data: WorkflowRun }> {
    return api.get(`/workflows/runs/${runId}`).then(res => res.data);
  }
};
