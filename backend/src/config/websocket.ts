import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from './env';

let io: SocketIOServer;

export interface RealTimeEvent {
  type: 'leaderboard_update' | 'thread_created' | 'score_updated' | 'achievement_unlocked';
  data: any;
  userId?: string;
  timestamp: number;
}

export function initializeWebSocket(server: HTTPServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all localhost origins
        if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          callback(null, true);
        } else if (env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Track connected users
  const connectedUsers = new Map<string, string>();

  io.on('connection', (socket: Socket) => {
    console.log(`✓ WebSocket connected: ${socket.id}`);

    // User joins
    socket.on('user_join', (userId: string) => {
      connectedUsers.set(socket.id, userId);
      console.log(`📱 User ${userId} joined (socket: ${socket.id})`);
      socket.emit('connection_status', { status: 'connected', message: 'Real-time updates enabled' });
    });

    // Subscribe to leaderboard updates
    socket.on('subscribe_leaderboard', () => {
      socket.join('leaderboard');
      console.log(`📊 Socket ${socket.id} subscribed to leaderboard`);
    });

    // Subscribe to community threads list
    socket.on('subscribe_community', () => {
      socket.join('community');
      console.log(`💬 Socket ${socket.id} subscribed to community`);
    });

    // Subscribe to a specific thread's updates
    socket.on('subscribe_thread', (threadId: string) => {
      socket.join(`thread_${threadId}`);
      console.log(`💬 Socket ${socket.id} subscribed to thread_${threadId}`);
    });
    
    // Unsubscribe from a specific thread
    socket.on('unsubscribe_thread', (threadId: string) => {
      socket.leave(`thread_${threadId}`);
      console.log(`💬 Socket ${socket.id} unsubscribed from thread_${threadId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      connectedUsers.delete(socket.id);
      console.log(`✗ WebSocket disconnected: ${socket.id} (user: ${userId})`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket() first.');
  }
  return io;
}

// Broadcast leaderboard updates to all connected clients
export function broadcastLeaderboardUpdate(leaderboardData: any) {
  if (!io) return;
  io.to('leaderboard').emit('leaderboard_updated', {
    type: 'leaderboard_update',
    data: leaderboardData,
    timestamp: Date.now(),
  });
  console.log('📡 Broadcasted leaderboard update');
}

// Broadcast score update
export function broadcastScoreUpdate(userId: string, scoreData: any) {
  if (!io) return;
  io.to('leaderboard').emit('score_updated', {
    type: 'score_updated',
    userId,
    data: scoreData,
    timestamp: Date.now(),
  });
  console.log(`📡 Broadcasted score update for user ${userId}`);
}

// Broadcast new thread creation
export function broadcastNewThread(threadData: any) {
  if (!io) return;
  io.to('community').emit('thread_created', {
    type: 'thread_created',
    data: threadData,
    timestamp: Date.now(),
  });
  console.log('📡 Broadcasted new thread');
}

// Broadcast thread update (replies, upvotes)
export function broadcastThreadUpdate(threadData: any) {
  if (!io) return;
  // Broadcast to anyone specifically viewing this thread
  io.to(`thread_${threadData.id}`).emit('thread_updated', {
    type: 'thread_updated',
    data: threadData,
    timestamp: Date.now(),
  });
  
  // Optionally, if we want the main community list to update, we can also broadcast to 'community'
  // But to save bandwidth we could skip it or just send a lightweight event
  io.to('community').emit('thread_updated', {
    type: 'thread_updated',
    data: threadData,
    timestamp: Date.now(),
  });
  console.log(`📡 Broadcasted update for thread ${threadData.id}`);
}

// Broadcast achievement unlocked
export function broadcastAchievementUnlocked(userId: string, achievementData: any) {
  if (!io) return;
  io.to('leaderboard').emit('achievement_unlocked', {
    type: 'achievement_unlocked',
    userId,
    data: achievementData,
    timestamp: Date.now(),
  });
  console.log(`📡 Broadcasted achievement unlocked for user ${userId}`);
}

// Broadcast trending topic update
export function broadcastTrendingUpdate(trendingTopics: any) {
  if (!io) return;
  io.to('community').emit('trending_updated', {
    type: 'trending_updated',
    data: trendingTopics,
    timestamp: Date.now(),
  });
  console.log('📡 Broadcasted trending topics update');
}
