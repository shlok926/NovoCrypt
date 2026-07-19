import { api } from '../lib/api';

export interface MigrationTask {
  id: string;
  migrationPhaseId: string;
  taskType: string;
  title: string;
  description: string;
  currentTechnology: string;
  recommendedTechnology: string;
  priority: number;
  status: string;
  estimatedHours: number;
  complexity: string;
}

export interface MigrationPhase {
  id: string;
  migrationPlanId: string;
  phaseOrder: number;
  title: string;
  description: string;
  status: string;
  tasks: MigrationTask[];
}

export interface MigrationPlan {
  id: string;
  assetId: string;
  status: string;
  overallPriority: number;
  businessPriority: number;
  technicalPriority: number;
  estimatedDurationDays: number;
  estimatedEngineeringEffort: number;
  estimatedRiskReduction: number;
  currentProgress: number;
  createdAt: string;
  phases: MigrationPhase[];
}

export const migrationApi = {
  listMigrations(limit = 50): Promise<{ data: MigrationPlan[] }> {
    return api.get(`/migrations?limit=${limit}`).then(res => res.data);
  },
  getAssetMigration(assetId: string): Promise<{ data: MigrationPlan | null }> {
    return api.get(`/migrations/asset/${assetId}`).then(res => res.data);
  }
};
