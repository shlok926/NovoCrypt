import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';
import { WorkflowEngine } from '../services/workflows/WorkflowEngine';

const router = Router();
router.use(authenticate);

// GET /api/workflows - List available templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const workflows = await prisma.workflow.findMany({
      include: { steps: { orderBy: { stepOrder: 'asc' } } }
    });
    res.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Fetch workflows error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workflows' });
  }
});

// POST /api/workflows/:id/run - Execute a workflow
router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { assetId, payload = {} } = req.body;

    if (!assetId) {
      return res.status(400).json({ success: false, message: 'assetId is required' });
    }

    const run = await WorkflowEngine.startWorkflow(id, assetId, userId, payload);
    res.json({ success: true, data: { runId: run.id, status: 'started' } });
  } catch (error) {
    console.error('Workflow start error:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Workflow start failed' });
  }
});

// GET /api/workflows/runs/:id - Get a specific run
router.get('/runs/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const run = await prisma.workflowRun.findFirst({
      where: { id, requestedByUserId: userId },
      include: {
        workflow: true,
        asset: { select: { name: true, assetType: true } },
        stepExecutions: {
          include: { step: true, job: true },
          orderBy: { startedAt: 'asc' }
        }
      }
    });

    if (!run) return res.status(404).json({ success: false, message: 'WorkflowRun not found' });

    res.json({ success: true, data: run });
  } catch (error) {
    console.error('Fetch workflow run error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch workflow run' });
  }
});

export default router;
