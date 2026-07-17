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
      const { subscription } = await threatsService.subscribeToAlerts(email, severityThreshold);
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
    const { isNew } = await threatsService.subscribeToAlerts(email, 'low');

    if (!isNew) {
      return res.status(409).json({ success: false, message: 'You are already subscribed to the newsletter!' });
    }

    // Send instant welcome email to prove it works
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
          .container { max-w-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #3b0764 100%); padding: 30px 20px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }
          .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
          .content h2 { color: #0f172a; font-size: 20px; margin-top: 0; }
          .cta-button { display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .footer a { color: #7c3aed; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ NovoCrypt Security</h1>
          </div>
          <div class="content">
            <h2>Welcome to the Quantum Frontier!</h2>
            <p>Hello,</p>
            <p>Thank you for subscribing to the <strong>NovoCrypt Quantum Threats Newsletter</strong>. You are now part of an exclusive group of professionals staying ahead of the post-quantum cryptographic curve.</p>
            
            <p><strong>What to expect from us:</strong></p>
            <ul>
              <li>Real-time alerts on cryptographic vulnerabilities (Q-Day updates)</li>
              <li>NIST standardization progress and implementation guides</li>
              <li>Deep dives into lattice-based and hash-based cryptography</li>
            </ul>

            <center>
              <a href="http://localhost:5173/dashboard" class="cta-button">Go to your Dashboard</a>
            </center>

            <p>If you have any questions, our support team is always ready to assist you. Let's secure the future together.</p>
            
            <p>Stay Secure,<br><strong>The NovoCrypt Team</strong></p>
          </div>
          <div class="footer">
            <p>You received this email because you subscribed on the NovoCrypt platform.</p>
            <p>NovoCrypt Inc. | 123 Security Blvd, Cyber City | <a href="http://localhost:5173">Privacy Policy</a> | <a href="http://localhost:5000/api/threats/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: '"NovoCrypt Security" <news@novocrypt.com>',
      to: email,
      subject: 'Welcome to NovoCrypt Quantum Threats Newsletter 🛡️',
      text: `Hello,\n\nWelcome to the Quantum Frontier! You have successfully subscribed to the NovoCrypt updates.\n\nStay secure,\nNovoCrypt Team`,
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Newsletter welcome email sent: %s", info.messageId);

    res.json({ success: true, message: 'Subscribed successfully! Welcome email sent.' });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    res.status(500).json({ success: false, message: 'Failed to subscribe' });
  }
});

// GET /api/threats/unsubscribe
router.get('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).send('Email parameter is required');
    }

    const success = await threatsService.unsubscribeFromAlerts(email);
    
    if (success) {
      res.send(`
        <html>
          <head>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 50px; background: #f4f7f6; color: #334155; }
              .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: 0 auto; }
              h1 { color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Unsubscribed Successfully</h1>
              <p>You will no longer receive alerts at <b>${email}</b>.</p>
              <br/>
              <a href="http://localhost:5173" style="color: #7c3aed; text-decoration: none;">Return to NovoCrypt</a>
            </div>
          </body>
        </html>
      `);
    } else {
      res.status(404).send('Subscription not found for this email.');
    }
  } catch (error) {
    console.error('Error unsubscribing:', error);
    res.status(500).send('Internal server error');
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
