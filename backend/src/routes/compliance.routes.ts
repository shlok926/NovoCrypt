import { Router } from 'express';
import { complianceService } from '../services/compliance.service';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// Get all compliance standards
router.get('/standards', async (req, res) => {
  try {
    const standards = await complianceService.getComplianceStandards();
    res.json({ success: true, data: standards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch standards' });
  }
});

// Get specific standard
router.get('/standards/:standardId', async (req, res) => {
  try {
    const standard = await complianceService.getStandardById(req.params.standardId);
    if (!standard) {
      return res.status(404).json({ success: false, error: 'Standard not found' });
    }
    res.json({ success: true, data: standard });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch standard' });
  }
});

// Check compliance
router.post('/check', requireAuth, async (req, res) => {
  try {
    const { organizationName, currentAlgorithms, targetStandards, industry } = req.body;
    
    if (!organizationName || !currentAlgorithms || !targetStandards) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }
    
    const result = await complianceService.checkCompliance({
      organizationName,
      currentAlgorithms,
      targetStandards,
      industry
    });
    
    // Try to save to database (will fail gracefully if in mock mode)
    try {
      const savedCheck = await prisma.complianceCheck.create({
        data: {
          userId: req.user!.userId,
          industry: industry || 'other',
          encryptionData: { algorithms: currentAlgorithms },
          results: result as any,
          overallStatus: result.overallCompliance >= 80 ? 'compliant' : result.overallCompliance >= 50 ? 'partial' : 'non-compliant'
        }
      });
    } catch (dbError) {
      console.warn('Could not save compliance check to database (mock mode):', dbError);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check compliance' });
  }
});

// Get user's compliance history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const history = await prisma.complianceCheck.findMany({
      where: { userId: req.user!.userId },
      orderBy: { checkedAt: 'desc' }
    });
    res.json({ success: true, data: history });
  } catch (error) {
    console.warn('Could not fetch compliance history (mock mode):', error);
    res.json({ success: true, data: [] });
  }
});

export default router;
