import { Router } from 'express';
import authRoutes from './auth.routes';
import labRoutes from './lab.routes';
import riskRoutes from './risk.routes';
import { algorithmsRouter } from './algorithms.routes';
import { reportsRouter } from './reports.routes';
import { contentRouter } from './content.routes';
import threatsRoutes from './threats.routes';
import qdayRoutes from './qday.routes';
import playgroundRoutes from './playground.routes';
import scannerRoutes from './scanner.routes';
import migrationRoutes from './migration.routes';
import complianceRoutes from './compliance.routes';
import communityRoutes from './community.routes';
import chatbotRoutes from './chatbot.routes';
import assetsRoutes from './assets.routes';
import jobsRoutes from './jobs.routes';
import workflowsRoutes from './workflows.routes';
import correlationsRoutes from './correlations.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/risk', riskRoutes);
router.use('/lab', labRoutes);
router.use('/algorithms', algorithmsRouter);
router.use('/reports', reportsRouter);
router.use('/content', contentRouter);
router.use('/threats', threatsRoutes);
router.use('/qday', qdayRoutes);
router.use('/scanner', scannerRoutes);
router.use('/playground', playgroundRoutes);
router.use('/migration', migrationRoutes);
router.use('/compliance', complianceRoutes);
router.use('/community', communityRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/assets', assetsRoutes);
router.use('/jobs', jobsRoutes);
router.use('/workflows', workflowsRoutes);
router.use('/correlations', correlationsRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      service: 'novocrypt-backend',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
