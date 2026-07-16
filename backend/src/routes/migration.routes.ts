import express, { Router } from 'express';
import { generateMigrationPlan } from '../services/migration.service';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// POST /api/migration/plan - Generate migration plan
router.post('/plan', requireAuth, async (req, res) => {
  try {
    const { organizationSize, industry, currentCrypto, budget, timeline } = req.body;

    // Validate required fields
    if (!organizationSize || !industry || !currentCrypto) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: organizationSize, industry, currentCrypto' }
      });
    }

    const plan = await generateMigrationPlan({
      organizationSize,
      industry,
      currentCrypto,
      budget: budget || 'medium',
      timeline: timeline || 'standard'
    });

    // Save to database
    const savedPlan = await prisma.migrationPlan.create({
      data: {
        userId: req.user!.userId,
        companyInfo: { organizationSize, industry },
        currentStack: { algorithms: currentCrypto },
        dataInventory: {},
        priorities: { budget: budget || 'medium', timeline: timeline || 'standard' },
        generatedPlan: plan as any,
        totalCostMin: plan.estimatedCost.total * 0.9,
        totalCostMax: plan.estimatedCost.total * 1.1,
        timelineMonths: parseInt(plan.timeline) || 12,
      }
    });

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to generate migration plan', details: error }
    });
  }
});

// GET /api/migration/plans - Get user's saved migration plans
router.get('/plans', requireAuth, async (req, res) => {
  try {
    const plans = await prisma.migrationPlan.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch saved plans', details: error }
    });
  }
});

// GET /api/migration/templates - Get migration plan templates
router.get('/templates', async (req, res) => {
  try {
    const templates = {
      organizationSizes: ['small', 'medium', 'large', 'enterprise'],
      industries: ['finance', 'healthcare', 'government', 'retail', 'technology', 'other'],
      budgetLevels: ['low', 'medium', 'high'],
      timelines: ['urgent', 'standard', 'flexible'],
      commonCryptoAlgorithms: [
        'RSA-2048',
        'RSA-4096',
        'ECDSA',
        'SHA-1',
        'SHA-256',
        'AES-128',
        'AES-256',
        'DES',
        'MD5'
      ]
    };

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch templates', details: error }
    });
  }
});

// POST /api/migration/validate - Validate current crypto setup
router.post('/validate', async (req, res) => {
  try {
    const { algorithms } = req.body;

    if (!algorithms || !Array.isArray(algorithms)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid algorithms format' }
      });
    }

    const vulnAlgorithms = [
      'RSA-1024',
      'RSA-2048',
      'ECDSA',
      'SHA-1',
      'DES',
      'MD5'
    ];

    const vulnerabilities = algorithms.map((algo: string) => ({
      algorithm: algo,
      isVulnerable: vulnAlgorithms.includes(algo),
      riskLevel: getRiskLevel(algo),
      recommendation: getRecommendation(algo)
    }));

    const summary = {
      totalAlgorithms: algorithms.length,
      vulnerableCount: vulnerabilities.filter((v: any) => v.isVulnerable).length,
      riskScore: calculateRiskScore(vulnerabilities),
      mitigationUrgency: getMitigationUrgency(vulnerabilities)
    };

    res.json({
      success: true,
      data: {
        vulnerabilities,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Validation failed', details: error }
    });
  }
});

function getRiskLevel(algo: string): 'critical' | 'high' | 'medium' | 'low' {
  const criticalAlgos = ['RSA-1024', 'DES', 'MD5', 'SHA-1'];
  const highAlgos = ['RSA-2048', 'ECDSA'];
  const mediumAlgos = ['AES-128'];

  if (criticalAlgos.includes(algo)) return 'critical';
  if (highAlgos.includes(algo)) return 'high';
  if (mediumAlgos.includes(algo)) return 'medium';
  return 'low';
}

function getRecommendation(algo: string): string {
  const recommendations: Record<string, string> = {
    'RSA-1024': 'CRITICAL: Migrate immediately to RSA-4096 or ML-KEM',
    'RSA-2048': 'Migrate to ML-KEM (Kyber) for quantum safety',
    'ECDSA': 'Migrate to ML-DSA (Dilithium) for signatures',
    'SHA-1': 'Migrate to SHA-256 or SHA-3 immediately',
    'DES': 'Migrate to AES-256 immediately',
    'MD5': 'Migrate to SHA-256 immediately',
    'AES-128': 'Consider upgrading to AES-256',
    'AES-256': 'Secure - retain in hybrid approach',
    'SHA-256': 'Secure - retain in hybrid approach'
  };
  return recommendations[algo] || 'Evaluate for migration';
}

function calculateRiskScore(vulnerabilities: any[]): number {
  let score = 0;
  vulnerabilities.forEach((v: any) => {
    if (v.riskLevel === 'critical') score += 25;
    else if (v.riskLevel === 'high') score += 15;
    else if (v.riskLevel === 'medium') score += 5;
  });
  return Math.min(score, 100);
}

function getMitigationUrgency(vulnerabilities: any[]): 'critical' | 'high' | 'medium' | 'low' {
  const criticalCount = vulnerabilities.filter((v: any) => v.riskLevel === 'critical').length;
  const highCount = vulnerabilities.filter((v: any) => v.riskLevel === 'high').length;

  if (criticalCount > 0) return 'critical';
  if (highCount > 2) return 'high';
  if (highCount > 0) return 'medium';
  return 'low';
}

export default router;
