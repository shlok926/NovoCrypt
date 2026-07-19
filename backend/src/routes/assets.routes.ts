import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { AssetActivityService } from '../services/assets/AssetActivityService';

const router = Router();
router.use(authenticate);

// GET /api/assets - List all assets for the user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const assets = await prisma.asset.findMany({
      where: { userId, status: 'active' },
      orderBy: { updatedAt: 'desc' },
      include: {
        scanResults: {
          orderBy: { scannedAt: 'desc' },
          take: 1
        }
      }
    });

    res.json({ success: true, data: assets });
  } catch (error) {
    console.error('List assets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assets' });
  }
});

// POST /api/assets - Create a new asset
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, assetType, repositoryUrl, domain, description, tags } = req.body;

    if (!name || !assetType) {
      return res.status(400).json({ success: false, message: 'Name and assetType are required' });
    }

    const asset = await prisma.asset.create({
      data: {
        userId,
        name,
        assetType,
        repositoryUrl,
        domain,
        description,
        tags: tags || [],
      }
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    console.error('Create asset error:', error);
    res.status(500).json({ success: false, message: 'Failed to create asset' });
  }
});

// GET /api/assets/:id - Get a single asset by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({
      where: { id, userId },
      include: {
        scanResults: {
          orderBy: { scannedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    res.json({ success: true, data: asset });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({ success: false, message: 'Failed to get asset' });
  }
});

// DELETE /api/assets/:id - Archive/Delete an asset
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const asset = await prisma.asset.updateMany({
      where: { id, userId },
      data: { status: 'archived' }
    });

    if (asset.count === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    res.json({ success: true, message: 'Asset archived successfully' });
  } catch (error) {
    console.error('Delete asset error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete asset' });
  }
});

// GET /api/assets/:id/timeline - Get asset event timeline
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({ where: { id, userId } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const timeline = await AssetActivityService.getTimeline(id);
    res.json({ success: true, data: timeline });
  } catch (error) {
    console.error('Timeline fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline' });
  }
});

// GET /api/assets/:id/snapshots - Get historical snapshots
router.get('/:id/snapshots', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({ where: { id, userId } });
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

    const snapshots = await AssetActivityService.getSnapshots(id);
    res.json({ success: true, data: snapshots });
  } catch (error) {
    console.error('Snapshots fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch snapshots' });
  }
});

export default router;
