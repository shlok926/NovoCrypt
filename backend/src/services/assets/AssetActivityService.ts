import { prisma } from '../../config/database';
import { ScanFinding } from '../scanner/types';

export type EventSeverity = 'info' | 'warning' | 'critical';
export type SourceModule = 'scanner' | 'threat-intel' | 'compliance' | 'system' | 'reporting' | 'migration';

export interface PublishEventDto {
  assetId: string;
  eventType: string;
  title: string;
  description: string;
  severity: EventSeverity;
  sourceModule: SourceModule;
  eventData?: any;
  createdByUserId?: string;
  systemGenerated?: boolean;
}

export interface PublishSnapshotDto {
  assetId: string;
  scanResultId?: string;
  overallRiskScore: number;
  quantumReadinessScore: number;
  findings: ScanFinding[];
}

export class AssetActivityService {
  /**
   * Publish a timeline event for an asset
   */
  static async publishEvent(data: PublishEventDto) {
    try {
      return await prisma.assetEvent.create({
        data: {
          assetId: data.assetId,
          eventType: data.eventType,
          title: data.title,
          description: data.description,
          severity: data.severity,
          sourceModule: data.sourceModule,
          eventData: data.eventData || {},
          createdByUserId: data.createdByUserId,
          systemGenerated: data.systemGenerated !== false, // default true
        },
      });
    } catch (error) {
      console.error('Failed to publish asset event:', error);
      throw error;
    }
  }

  /**
   * Publish a state snapshot for an asset
   */
  static async publishSnapshot(data: PublishSnapshotDto) {
    try {
      // Calculate metrics from findings
      const criticalFindings = data.findings.filter(f => f.severity === 'critical').length;
      const highFindings = data.findings.filter(f => f.severity === 'high').length;
      const mediumFindings = data.findings.filter(f => f.severity === 'medium').length;
      const lowFindings = data.findings.filter(f => f.severity === 'low').length;

      // Extract algorithm summary
      const algorithmSummary = data.findings.reduce((acc, finding) => {
        if (finding.algorithm) {
          acc[finding.algorithm] = (acc[finding.algorithm] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return await prisma.assetSnapshot.create({
        data: {
          assetId: data.assetId,
          scanResultId: data.scanResultId,
          overallRiskScore: data.overallRiskScore,
          quantumReadinessScore: data.quantumReadinessScore,
          criticalFindings,
          highFindings,
          mediumFindings,
          lowFindings,
          algorithmSummary,
        },
      });
    } catch (error) {
      console.error('Failed to publish asset snapshot:', error);
      throw error;
    }
  }

  /**
   * Utility to fetch the timeline for an asset
   */
  static async getTimeline(assetId: string, limit = 50) {
    return prisma.assetEvent.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
  }

  /**
   * Utility to fetch snapshots for trend analytics
   */
  static async getSnapshots(assetId: string, limit = 10) {
    return prisma.assetSnapshot.findMany({
      where: { assetId },
      orderBy: { capturedAt: 'desc' },
      take: limit,
    });
  }
}
