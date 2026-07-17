import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import * as threatsService from '../services/threats.service';
import nodemailer from 'nodemailer';

const router = Router();

// GET /api/threats/feed
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, category, severity } = req.query;
    const feed = await threatsService.getThreatFeed(
      parseInt(page as string),
      parseInt(limit as string),
      category as string | undefined,
      severity as string | undefined
    );
    res.json({ success: true, data: feed });
  } catch (error) {
    console.error('Error fetching threat feed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch threat feed' });
  }
});

// GET /api/threats/live
router.get('/live', async (req: Request, res: Response) => {
  try {
    const liveThreats = await threatsService.fetchLiveQuantumThreats();
    res.json({ success: true, data: liveThreats });
  } catch (error) {
    console.error('Error fetching live threats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch live threats' });
  }
});

// GET /api/threats/level
router.get('/level', async (req: Request, res: Response) => {
  try {
    const threatLevel = await threatsService.calculateGlobalThreatLevel();
    res.json({ success: true, data: threatLevel });
  } catch (error) {
    console.error('Error calculating threat level:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate threat level' });
  }
});

// GET /api/threats/advisories
router.get('/advisories', async (req: Request, res: Response) => {
  try {
    const advisories = await threatsService.getGovernmentAdvisories();
    res.json({ success: true, data: advisories });
  } catch (error) {
    console.error('Error fetching advisories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advisories' });
  }
});

// GET /api/threats/vendors
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await threatsService.getVendorAlerts();
    res.json({ success: true, data: vendors });
  } catch (error) {
    console.error('Error fetching vendor alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor alerts' });
  }
});

// GET /api/threats/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await threatsService.getThreatStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
});

// POST /api/threats/subscribe
router.post(
  '/subscribe',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { email, severityThreshold } = req.body;
      if (!email || !severityThreshold) {
        return res.status(400).json({
          success: false,
          message: 'Email and severity threshold are required',
        });
      }
      const subscription = await threatsService.subscribeToAlerts(email, severityThreshold);
      res.status(201).json({
        success: true,
        message: 'Successfully subscribed to threat alerts',
        data: subscription,
      });
    } catch (error) {
      console.error('Error subscribing to alerts:', error);
      res.status(500).json({ success: false, message: 'Failed to subscribe to alerts' });
    }
  }
);

// Configure Nodemailer for the public newsletter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
    pass: process.env.SMTP_PASS || 'etherealpassword',
  },
});

// POST /api/threats/newsletter
router.post('/newsletter', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Save to DB (reusing subscribe logic with default threshold)
    await threatsService.subscribeToAlerts(email, 'low');

    // Send instant welcome email to prove it works
    const mailOptions = {
      from: '"NovoCrypt Newsletter" <news@novocrypt.com>',
      to: email,
      subject: 'Welcome to NovoCrypt Quantum Threats Newsletter!',
      text: `Hello,\n\nYou have successfully subscribed to the NovoCrypt updates. You'll receive real-time alerts about quantum threats and NIST standards right here.\n\nStay secure,\nNovoCrypt Team`,
      html: `<b>Hello,</b><br><br>You have successfully subscribed to the NovoCrypt updates. You'll receive real-time alerts about quantum threats and NIST standards right here.<br><br>Stay secure,<br>NovoCrypt Team`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Newsletter welcome email sent: %s", info.messageId);

    res.json({ success: true, message: 'Subscribed successfully! Welcome email sent.' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
});

// POST /api/threats/seed
router.post('/seed', async (req: Request, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Seeding not allowed in production',
      });
    }
    await threatsService.seedSampleThreats();
    res.json({
      success: true,
      message: 'Sample threats seeded successfully',
    });
  } catch (error) {
    console.error('Error seeding threats:', error);
    res.status(500).json({ success: false, message: 'Failed to seed threats' });
  }
});

export default router;
