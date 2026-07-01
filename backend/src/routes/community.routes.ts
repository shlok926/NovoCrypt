import { Router } from 'express';
import { communityService } from '../services/community.service';
import { broadcastLeaderboardUpdate, broadcastScoreUpdate, broadcastNewThread, broadcastTrendingUpdate } from '../config/websocket';

const router = Router();

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const leaderboard = await communityService.getLeaderboard(limit);
    
    // Broadcast update to all connected clients
    broadcastLeaderboardUpdate(leaderboard);
    
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// Get user profile
router.get('/users/:userId', async (req, res) => {
  try {
    const profile = await communityService.getUserProfile(req.params.userId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
});

// Get user achievements
router.get('/users/:userId/achievements', async (req, res) => {
  try {
    const achievements = await communityService.getUserAchievements(req.params.userId);
    res.json({ success: true, data: achievements });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch achievements' });
  }
});

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await communityService.getAchievements();
    res.json({ success: true, data: achievements });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch achievements' });
  }
});

// Get community threads
router.get('/threads', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const threads = await communityService.getCommunityThreads(category);
    res.json({ success: true, data: threads });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch threads' });
  }
});

// Get specific thread
router.get('/threads/:threadId', async (req, res) => {
  try {
    const thread = await communityService.getThreadById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    res.json({ success: true, data: thread });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch thread' });
  }
});

// Search threads
router.get('/threads/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }
    const results = await communityService.searchThreads(query);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search threads' });
  }
});

// Get popular threads
router.get('/threads-popular', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const threads = await communityService.getPopularThreads(limit);
    res.json({ success: true, data: threads });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch popular threads' });
  }
});

// Get trending topics
router.get('/trending', async (req, res) => {
  try {
    const topics = await communityService.getTrendingTopics();
    res.json({ success: true, data: topics });
    
    // Broadcast trending update
    broadcastTrendingUpdate(topics);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch trending topics' });
  }
});

// Update user score (triggers real-time broadcast)
router.post('/score/update', async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    if (!userId || !points) {
      return res.status(400).json({ success: false, error: 'userId and points required' });
    }
    
    // Update would happen here (for now just mock)
    const scoreUpdate = { userId, points, reason, timestamp: new Date() };
    
    // Broadcast to all connected clients
    broadcastScoreUpdate(userId, scoreUpdate);
    
    // Also update leaderboard
    const leaderboard = await communityService.getLeaderboard(20);
    broadcastLeaderboardUpdate(leaderboard);
    
    res.json({ success: true, data: scoreUpdate, message: 'Score updated and broadcasted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update score' });
  }
});

// Create new thread (triggers real-time broadcast)
router.post('/threads/create', async (req, res) => {
  try {
    const { title, content, category, author } = req.body;
    if (!title || !author) {
      return res.status(400).json({ success: false, error: 'title and author required' });
    }
    
    // Create thread in memory store
    const newThread = await communityService.createThread(title, content, category || 'discussion', author);
    
    // Broadcast new thread to all clients
    broadcastNewThread(newThread);
    
    res.json({ success: true, data: newThread, message: 'Thread created and broadcasted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create thread' });
  }
});

// Upvote thread
router.post('/threads/:id/upvote', async (req, res) => {
  try {
    const thread = await communityService.upvoteThread(req.params.id);
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    
    // In a real app we'd broadcast just the upvote update
    // For now we can reuse broadcastNewThread as a hack or just let the client poll/update state locally
    // broadcastNewThread(thread); 
    
    res.json({ success: true, data: thread });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upvote thread' });
  }
});

export default router;
