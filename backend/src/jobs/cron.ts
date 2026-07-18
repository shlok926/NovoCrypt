import cron from 'node-cron';
import { env } from '../config/env';
import { fetchLiveQuantumThreats, createThreatItem, cleanOldThreats } from '../services/threats.service';
import { prisma } from '../config/database';
import { broadcastThreatAlert } from '../config/websocket';
import { reportService } from '../services/report.service';
import { redis } from '../config/redis';

import crypto from 'crypto';

/**
 * Distributed lock to prevent duplicate cron executions across multiple instances.
 */
async function withRedisLock(lockKey: string, lockDurationSeconds: number, callback: () => Promise<void>) {
  const token = crypto.randomBytes(16).toString('hex');
  let acquired = false;
  try {
    acquired = (await redis.set(lockKey, token, 'EX', lockDurationSeconds, 'NX')) === 'OK';
    if (!acquired) {
      console.log(`[CRON] Lock ${lockKey} is already acquired by another instance. Skipping execution.`);
      return;
    }
    await callback();
  } catch (error) {
    // If Redis is down, we might proceed or fail gracefully depending on criticality. 
    // For reports, we prefer skipping to avoid duplicate spam if we can't guarantee a lock.
    console.error(`[CRON] Failed to acquire lock for ${lockKey} due to Redis error. Skipping execution.`, error);
  } finally {
    if (acquired) {
      try {
        // Lua script to ensure we only delete the lock if we own it
        const script = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        await redis.eval(script, 1, lockKey, token);
      } catch (cleanupError) {
        console.error(`[CRON] Failed to release lock ${lockKey}`, cleanupError);
      }
    }
  }
}

export function initializeCronJobs() {
  console.log('[CRON] Initializing background jobs...');

  // Threat Intelligence Fetcher
  cron.schedule(env.CRON_THREAT_FETCH || '0 */6 * * *', async () => {
    await withRedisLock('cron:lock:threat_sync', 300, async () => {
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
  });

  // Automated Reports: Weekly Threat Summary (Every Monday at 9:00 AM)
  cron.schedule('0 9 * * 1', async () => {
    await withRedisLock('cron:lock:weekly_reports', 1800, async () => {
      console.log('[CRON] Initiating Weekly Threat Reports dispatch...');
      await reportService.processWeeklyReports();
    });
  });

  // Automated Reports: Monthly Compliance Report (First day of month at 8:00 AM)
  cron.schedule('0 8 1 * *', async () => {
    await withRedisLock('cron:lock:monthly_reports', 1800, async () => {
      console.log('[CRON] Initiating Monthly Compliance Reports dispatch...');
      await reportService.processMonthlyReports();
    });
  });
}
