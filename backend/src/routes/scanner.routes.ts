import { Router, Request, Response } from 'express';
import { scannerEngine } from '../services/scanner';
import { prisma } from '../config/database';

const router = Router();

// POST /api/scanner/ssl - Scan SSL certificate
router.post('/ssl', async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    const userId = req.user?.id;

    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain is required' });
    }

    const result = await scannerEngine.runScan({
      targetType: 'url',
      target: domain,
    });

    if (userId) {
      await prisma.scanResult.create({
        data: {
          userId,
          scanType: 'url',
          inputTarget: domain,
          findings: result.findings as any,
          overallScore: result.overallRiskScore,
          riskLevel: result.riskLevel,
        }
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('SSL scan error:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'SSL scan failed' });
  }
});

// POST /api/scanner/code - Scan code for vulnerabilities
router.post('/code', async (req: Request, res: Response) => {
  try {
    const { code, fileName = 'code.js' } = req.body;
    const userId = req.user?.id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required' });
    }

    const result = await scannerEngine.runScan({
      targetType: 'code',
      target: code,
      fileName,
    });

    if (userId) {
      await prisma.scanResult.create({
        data: {
          userId,
          scanType: 'code',
          inputTarget: fileName,
          findings: result.findings as any,
          overallScore: result.overallRiskScore,
          riskLevel: result.riskLevel,
        }
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Code scan error:', error);
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Code scan failed' });
  }
});

// POST /api/scanner/ssl/batch - Batch scan domains
router.post('/ssl/batch', async (req: Request, res: Response) => {
  try {
    const { domains } = req.body;

    if (!Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ success: false, message: 'Domains array is required' });
    }

    const results = await Promise.all(
      domains.map(domain => scannerEngine.runScan({ targetType: 'url', target: domain }))
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Batch SSL scan error:', error);
    res.status(500).json({ success: false, message: 'Batch SSL scan failed' });
  }
});

// GET /api/scanner/history - Get scan history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const limit = parseInt(req.query.limit as string) || 20;

    const history = await prisma.scanResult.findMany({
      where: { userId },
      orderBy: { scannedAt: 'desc' },
      take: limit
    });

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch scan history' });
  }
});

// GET /api/scanner/statistics - Get scan statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const totalScans = await prisma.scanResult.count({ where: { userId } });
    
    // Simplistic statistics for now
    const stats = {
      totalScans,
      sslScans: await prisma.scanResult.count({ where: { userId, scanType: 'url' } }),
      codeScans: await prisma.scanResult.count({ where: { userId, scanType: 'code' } }),
      criticalVulnerabilities: 0,
      avgRiskLevel: 'medium',
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// GET /api/scanner/recommendations - Get quantum-safe recommendations
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const recommendations = {
      vulnerable: [
        {
          algorithm: 'RSA-2048',
          reason: 'Vulnerable to quantum attacks (Shor\'s algorithm)',
          severity: 'critical',
        },
        {
          algorithm: 'SHA-1',
          reason: 'Collision vulnerabilities detected',
          severity: 'high',
        },
        {
          algorithm: 'MD5',
          reason: 'Cryptographically broken and unsuitable for use',
          severity: 'critical',
        },
      ],
      safe: [
        {
          algorithm: 'CRYSTALS-Kyber (ML-KEM)',
          description: 'Post-quantum key encapsulation mechanism',
          migrationSteps: [
            'Evaluate Kyber-1024 for most applications',
            'Implement hybrid RSA+Kyber approach',
            'Test key generation and encapsulation',
            'Deploy in staged rollout',
            'Monitor performance metrics',
          ],
        },
        {
          algorithm: 'CRYSTALS-Dilithium (ML-DSA)',
          description: 'Post-quantum digital signature algorithm',
          migrationSteps: [
            'Audit current signature usage',
            'Plan hybrid RSA+Dilithium deployment',
            'Implement new signing infrastructure',
            'Test signature verification',
            'Complete transition',
          ],
        },
        {
          algorithm: 'SHA-256 / SHA-3',
          description: 'Modern cryptographic hash functions',
          migrationSteps: [
            'Replace SHA-1 with SHA-256',
            'Consider SHA-3 for new projects',
            'Update libraries and frameworks',
            'Re-hash existing data where applicable',
            'Complete SHA-1 deprecation',
          ],
        },
      ],
      timeline: 'Immediate (MD5) → 6-12 months (SHA-1) → 1-2 years (RSA) → 2-3 years (Full PQC)',
    };

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations',
    });
  }
});

export default router;
