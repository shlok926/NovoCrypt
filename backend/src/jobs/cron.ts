import cron from 'node-cron';
import { env } from '../config/env';
import { fetchLiveQuantumThreats, createThreatItem, cleanOldThreats } from '../services/threats.service';
import { prisma } from '../config/database';
import { broadcastThreatAlert } from '../config/websocket';
import { reportService } from '../services/report.service';

export function initializeCronJobs() {
  console.log('[CRON] Initializing background jobs...');

  // Threat Intelligence Fetcher
  cron.schedule(env.CRON_THREAT_FETCH || '0 */6 * * *', async () => {
    console.log('[CRON] Starting Threat Intelligence Sync...');
    try {
      const items = await fetchLiveQuantumThreats();
      let newCount = 0;

      for (const item of items) {
        // Prevent duplicates
        const exists = await prisma.threatItem.findFirst({
          where: { title: item.title },
        });

        if (!exists) {
          const newThreat = await createThreatItem(item);
          newCount++;

          // Alert System: If High/Critical, broadcast it
          if (newThreat.severity === 'high' || newThreat.severity === 'critical') {
            console.log(`[ALERT] High severity threat detected: ${newThreat.title}`);
            broadcastThreatAlert(newThreat);
          }
        }
      }
      console.log(`[CRON] Sync complete. Added ${newCount} new threats.`);

      // Clean old data to save DB space
      await cleanOldThreats();
    } catch (error) {
      console.error('[CRON] Threat sync failed:', error);
    }
  });

  // Automated Reports: Weekly Threat Summary (Every Monday at 9:00 AM)
  cron.schedule('0 9 * * 1', async () => {
    console.log('[CRON] Initiating Weekly Threat Reports dispatch...');
    await reportService.processWeeklyReports();
  });

  // Automated Reports: Monthly Compliance Report (First day of month at 8:00 AM)
  cron.schedule('0 8 1 * *', async () => {
    console.log('[CRON] Initiating Monthly Compliance Reports dispatch...');
    await reportService.processMonthlyReports();
  });
}
