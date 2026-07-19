import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { QueueService } from '../services/jobs/QueueService';

const router = Router();
router.use(authenticate);

// GET /api/jobs - List user's jobs
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const jobs = await prisma.job.findMany({
      where: { requestedByUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        asset: { select: { name: true, assetType: true } }
      }
    });

    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Get specific job status
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const job = await prisma.job.findFirst({
      where: { id, requestedByUserId: userId },
      include: {
        asset: { select: { name: true, assetType: true } }
      }
    });

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Fetch job error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
});

export default router;
