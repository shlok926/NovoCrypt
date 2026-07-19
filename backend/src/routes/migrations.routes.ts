import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/migrations - List all migrations
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const migrations = await prisma.migrationPlan.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        phases: {
          include: { tasks: true }
        }
      }
    });

    res.json({ success: true, data: migrations });
  } catch (error) {
    console.error('Fetch migrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch migrations' });
  }
});

// GET /api/migrations/asset/:assetId - Get migrations for an asset
router.get('/asset/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    const migration = await prisma.migrationPlan.findFirst({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
      include: {
        phases: {
          orderBy: { phaseOrder: 'asc' },
          include: {
            tasks: { orderBy: { priority: 'desc' } }
          }
        },
        decisions: true
      }
    });

    if (!migration) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: migration });
  } catch (error) {
    console.error('Fetch asset migration error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch asset migration' });
  }
});

export default router;
