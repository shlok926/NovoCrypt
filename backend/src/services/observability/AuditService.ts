import { Logger } from './Logger';

export interface AuditEvent {
  traceId: string;
  jobId: string;
  stage: 'Submission' | 'Queue Entry' | 'Worker Assignment' | 'Repository Acquisition' | 'Detection Started' | 'Detection Completed' | 'Correlation Completed' | 'Report Generated' | 'Cleanup Completed' | 'Failed';
  status: 'pending' | 'in_progress' | 'success' | 'failure';
  actor?: string; // system or user id
  details?: any;
}

export class AuditService {
  private logger = new Logger({ component: 'AuditTrail' });

  public recordEvent(event: AuditEvent) {
    // In an enterprise system, this would write to a WORM (Write Once Read Many) 
    // database or immutable ledger. We log it securely.
    this.logger.info(`Audit Event: ${event.stage} [${event.status}]`, {
      audit: true,
      ...event
    });
  }
}

export const auditService = new AuditService();
