import { api } from '../lib/api';

export interface Job {
  id: string;
  jobType: string;
  jobStatus: 'queued' | 'waiting' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  assetId?: string;
  queueName: string;
  payload: any;
  progress: number;
  currentStage?: string;
  attemptCount: number;
  maxAttempts: number;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export const jobApi = {
  list(limit = 50): Promise<{ data: Job[] }> {
    return api.get(`/jobs?limit=${limit}`).then(res => res.data);
  },
  get(id: string): Promise<{ data: Job }> {
    return api.get(`/jobs/${id}`).then(res => res.data);
  }
};
