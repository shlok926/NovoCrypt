import { api } from '../lib/api';

export interface Asset {
  id: string;
  name: string;
  assetType: 'github' | 'git' | 'website' | 'ssl' | 'local' | 'cloud' | 'sbom';
  repositoryUrl?: string;
  domain?: string;
  description?: string;
  tags: string[];
  status: 'active' | 'archived' | 'deleted';
  currentRiskScore?: number;
  currentQuantumReadiness?: number;
  latestScanId?: string;
  lastScanAt?: string;
  nextScheduledScanAt?: string;
  createdAt: string;
  updatedAt: string;
  scanResults?: any[];
}

export interface AssetEvent {
  id: string;
  assetId: string;
  eventType: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  sourceModule: string;
  eventData?: any;
  createdAt: string;
}

export interface AssetSnapshot {
  id: string;
  assetId: string;
  scanResultId?: string;
  overallRiskScore: number;
  quantumReadinessScore: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  algorithmSummary: Record<string, number>;
  capturedAt: string;
}

export const assetApi = {
  list(): Promise<{ data: Asset[] }> {
    return api.get('/assets').then(res => res.data);
  },
  get(id: string): Promise<{ data: Asset }> {
    return api.get(`/assets/${id}`).then(res => res.data);
  },
  create(data: Partial<Asset>): Promise<{ data: Asset }> {
    return api.post('/assets', data).then(res => res.data);
  },
  archive(id: string): Promise<{ success: boolean }> {
    return api.delete(`/assets/${id}`).then(res => res.data);
  },
  getTimeline(id: string): Promise<{ data: AssetEvent[] }> {
    return api.get(`/assets/${id}/timeline`).then(res => res.data);
  },
  getSnapshots(id: string): Promise<{ data: AssetSnapshot[] }> {
    return api.get(`/assets/${id}/snapshots`).then(res => res.data);
  }
};
