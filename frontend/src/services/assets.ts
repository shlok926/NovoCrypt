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
  }
};
