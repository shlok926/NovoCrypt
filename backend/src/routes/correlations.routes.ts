import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/correlations - List all correlations
router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const correlations = await prisma.threatCorrelation.findMany({
      orderBy: { correlatedAt: 'desc' },
      take: limit,
      include: {
        matches: true,
        recommendations: true,
      }
    });

    res.json({ success: true, data: correlations });
  } catch (error) {
    console.error('Fetch correlations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch correlations' });
  }
});

// GET /api/correlations/asset/:assetId - Get correlations for an asset
router.get('/asset/:assetId', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const correlations = await prisma.threatCorrelation.findMany({
      where: { assetId },
      orderBy: { correlatedAt: 'desc' },
      take: limit,
      include: {
        matches: { include: { rule: true, advisory: true } },
        recommendations: { orderBy: { priority: 'desc' } },
      }
    });

    res.json({ success: true, data: correlations });
  } catch (error) {
    console.error('Fetch asset correlations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch asset correlations' });
  }
});

export default router;
