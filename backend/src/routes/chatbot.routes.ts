import { Router } from 'express';
import { chatbotService } from '../services/chatbot.service';
import { requireAuth } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// Send message to chatbot
router.post('/message', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Message required' 
      });
    }
    
    const response = await chatbotService.chat(message);
    
    // Attempt DB persistence
    try {
      // Find or create session for user
      let session = await prisma.chatSession.findFirst({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: 'desc' }
      });
      if (!session) {
        session = await prisma.chatSession.create({
          data: { userId: req.user!.userId }
        });
      }
      
      // Save User Message
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'user',
          content: message,
          tokensUsed: message.length
        }
      });
      
      // Save Assistant Message
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: response,
          tokensUsed: response.length
        }
      });
    } catch (dbError) {
      console.warn('Could not save chat message to DB (mock mode):', dbError);
    }
    
    res.json({ 
      success: true, 
      data: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process message' });
  }
});

// Get chat suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = await chatbotService.getChatSuggestions();
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
});

export default router;
