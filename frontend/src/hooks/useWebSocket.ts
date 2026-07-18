import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export interface RealTimeEvent {
  type: 'leaderboard_update' | 'thread_created' | 'score_updated' | 'achievement_unlocked' | 'trending_updated' | 'thread_reply' | 'threat_alert';
  data: any;
  userId?: string;
  threadId?: string;
  timestamp: number;
}

export function useWebSocket(userId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const eventHandlersRef = useRef<Map<string, ((event: RealTimeEvent) => void)[]>>(new Map());

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    // Create socket connection
    const wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:5000';
    const socket = io(wsUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✓ WebSocket connected');
      setIsConnected(true);

      // Emit user join event
      socket.emit('user_join', userId);
    });

    socket.on('connection_status', (data) => {
      console.log('Connection status:', data);
    });

    // Leaderboard updates
    socket.on('leaderboard_updated', (event: RealTimeEvent) => {
      console.log('📊 Leaderboard updated:', event.data);
      setEvents((prev) => [...prev, event]);
      triggerHandlers('leaderboard_update', event);
    });

    // Score updates
    socket.on('score_updated', (event: RealTimeEvent) => {
      console.log('🏆 Score updated:', event.data);
      setEvents((prev) => [...prev, event]);
      triggerHandlers('score_updated', event);
    });

    // New threads
    socket.on('thread_created', (event: RealTimeEvent) => {
      console.log('💬 New thread created:', event.data);
      setEvents((prev) => [...prev, event]);
      triggerHandlers('thread_created', event);
    });

    // Thread replies / updates (Scoped)
    socket.on('thread_updated', (event: RealTimeEvent) => {
      console.log('💬 Thread updated:', event.data);
      setEvents((prev) => [...prev, event]);
      triggerHandlers('thread_updated', event);
    });

    // Achievements
    socket.on('achievement_unlocked', (event: RealTimeEvent) => {
      console.log('⭐ Achievement unlocked:', event.data);
      setEvents((prev) => [...prev, event]);
      triggerHandlers('achievement_unlocked', event);
    });

    // Trending topics
    socket.on('trending_updated', (event: RealTimeEvent) => {
      console.log('🔥 Trending topics updated:', event.data);
      setEvents((prev) => [...prev, event]);
      triggerHandlers('trending_updated', event);
    });

    // Threat Alerts
    socket.on('threat:alert', (event: RealTimeEvent) => {
      console.log('🚨 New Threat Alert:', event.data);
      setEvents((prev) => [...prev, event]);
      triggerHandlers('threat_alert', event);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log('✗ WebSocket disconnected');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const triggerHandlers = useCallback((type: string, event: RealTimeEvent) => {
    const handlers = eventHandlersRef.current.get(type) || [];
    handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in handler for ${type}:`, error);
      }
    });
  }, []);

  // Subscribe to leaderboard updates
  const subscribeToLeaderboard = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe_leaderboard');
      console.log('Subscribed to leaderboard updates');
    }
  }, []);

  // Subscribe to community updates
  const subscribeToCommunity = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe_community');
      console.log('Subscribed to community updates');
    }
  }, []);

  // Subscribe to specific thread
  const subscribeToThread = useCallback((threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe_thread', threadId);
      console.log(`Subscribed to thread ${threadId}`);
    }
  }, []);

  // Unsubscribe from specific thread
  const unsubscribeFromThread = useCallback((threadId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe_thread', threadId);
      console.log(`Unsubscribed from thread ${threadId}`);
    }
  }, []);

  // Register event handler
  const on = useCallback((type: string, handler: (event: RealTimeEvent) => void) => {
    if (!eventHandlersRef.current.has(type)) {
      eventHandlersRef.current.set(type, []);
    }
    eventHandlersRef.current.get(type)!.push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = eventHandlersRef.current.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);

  return {
    isConnected,
    events,
    subscribeToLeaderboard,
    subscribeToCommunity,
    subscribeToThread,
    unsubscribeFromThread,
    on,
    socket: socketRef.current,
  };
}
