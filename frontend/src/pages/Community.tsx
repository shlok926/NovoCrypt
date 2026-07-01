import { useState, useEffect } from 'react';
import { Trophy, MessageSquare, Eye, ThumbsUp, Tag, TrendingUp, Zap, Shield } from 'lucide-react';
import { communityService } from '@/services/complianceCommunityService';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { LeaderboardEntry, CommunityThread, TrendingTopic } from '@/types/compliance-community-chatbot.types';

export default function Community() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'threads' | 'trending'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  // New thread form state
  const [showNewThreadForm, setShowNewThreadForm] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('discussion');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // WebSocket hook for real-time updates
  const { isConnected, subscribeToLeaderboard, subscribeToCommunity, on } = useWebSocket('current-user');

  useEffect(() => {
    setWsStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  useEffect(() => {
    const loadData = async () => {
      const [lb, thrd, trend] = await Promise.all([
        communityService.getLeaderboard(),
        communityService.getThreads(selectedCategory),
        communityService.getTrendingTopics()
      ]);
      setLeaderboard(lb);
      setThreads(thrd);
      setTrending(trend);
    };
    loadData();
  }, [selectedCategory]);

  // Subscribe to real-time updates on mount
  useEffect(() => {
    subscribeToLeaderboard();
    subscribeToCommunity();
  }, [subscribeToLeaderboard, subscribeToCommunity]);

  // Listen for leaderboard updates
  useEffect(() => {
    const unsubscribe = on('leaderboard_update', async (event) => {
      console.log('🔄 Real-time leaderboard update received:', event.data);
      setLeaderboard(event.data);
    });
    return unsubscribe;
  }, [on]);

  // Listen for score updates
  useEffect(() => {
    const unsubscribe = on('score_updated', async (event) => {
      console.log('🏆 Real-time score update:', event.data);
      // Refresh leaderboard
      const lb = await communityService.getLeaderboard();
      setLeaderboard(lb);
    });
    return unsubscribe;
  }, [on]);

  // Listen for new threads
  useEffect(() => {
    const unsubscribe = on('thread_created', async (event) => {
      console.log('💬 New thread notification:', event.data);
      // Refresh threads
      const thrd = await communityService.getThreads(selectedCategory);
      setThreads(thrd);
    });
    return unsubscribe;
  }, [on, selectedCategory]);

  // Listen for trending updates
  useEffect(() => {
    const unsubscribe = on('trending_updated', (event) => {
      console.log('🔥 Trending topics update:', event.data);
      setTrending(event.data);
    });
    return unsubscribe;
  }, [on]);

  const categories = ['discussion', 'question', 'guide', 'news'];

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    
    setIsSubmitting(true);
    const newThread = await communityService.createThread(
      newThreadTitle, 
      newThreadContent, 
      newThreadCategory
    );
    
    if (newThread) {
      // It will also be received via websocket, but we can optimistically update
      setThreads(prev => [newThread, ...prev]);
      setShowNewThreadForm(false);
      setNewThreadTitle('');
      setNewThreadContent('');
    }
    setIsSubmitting(false);
  };

  const handleUpvote = async (threadId: string) => {
    // Optimistic UI update
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t
    ));
    
    await communityService.upvoteThread(threadId);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Premium Header */}
      <div className="relative overflow-hidden bg-slate-950 border-b border-slate-800 pt-16 pb-12">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-5 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <Shield className="w-4 h-4" />
                Community Hub
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Global Security <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Network</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl">
                Collaborate with quantum cryptography experts, share migration strategies, and track organizational readiness on the global leaderboard.
              </p>
            </div>
            <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border ${
              isConnected 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            } shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}>
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400'}`}></div>
              <span className="font-semibold tracking-wide text-sm uppercase">
                {isConnected ? 'Live Sync Active' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-800">
          {(['leaderboard', 'threads', 'trending'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-semibold text-sm uppercase tracking-wide transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-blue-400 border-blue-400 bg-blue-400/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-700'
              }`}
            >
              {tab === 'leaderboard' && <Trophy className="w-4 h-4 inline mr-2 -mt-1" />}
              {tab === 'threads' && <MessageSquare className="w-4 h-4 inline mr-2 -mt-1" />}
              {tab === 'trending' && <TrendingUp className="w-4 h-4 inline mr-2 -mt-1" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800/50 to-slate-900">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  Enterprise Readiness Rankings
                </h2>
                <div className="text-sm font-medium text-slate-500 flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Real-time Data
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-xs tracking-widest text-slate-400 uppercase bg-slate-900/80">
                    <th className="px-8 py-5 text-left font-bold">Rank</th>
                    <th className="px-8 py-5 text-left font-bold">Organization / Expert</th>
                    <th className="px-8 py-5 text-center font-bold">Security Score</th>
                    <th className="px-8 py-5 text-center font-bold">Audits Completed</th>
                    <th className="px-8 py-5 text-center font-bold">Certifications</th>
                    <th className="px-8 py-5 text-right font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {leaderboard.map((entry, idx) => (
                    <tr
                      key={entry.userId}
                      className={`group transition-all duration-300 hover:bg-slate-800/50 ${
                        idx === 0 ? 'bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent' : 
                        idx === 1 ? 'bg-gradient-to-r from-slate-300/5 via-transparent to-transparent' :
                        idx === 2 ? 'bg-gradient-to-r from-amber-700/5 via-transparent to-transparent' : ''
                      }`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          {entry.rank === 1 && <span className="flex items-center justify-center w-9 h-9 rounded-full bg-yellow-500/10 text-yellow-500 font-bold border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">1</span>}
                          {entry.rank === 2 && <span className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-300/10 text-slate-300 font-bold border border-slate-300/30 shadow-[0_0_15px_rgba(203,213,225,0.15)]">2</span>}
                          {entry.rank === 3 && <span className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-700/10 text-amber-500 font-bold border border-amber-700/30 shadow-[0_0_15px_rgba(180,83,9,0.2)]">3</span>}
                          {entry.rank > 3 && <span className="flex items-center justify-center w-9 h-9 text-slate-500 font-bold">{entry.rank}</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/50 text-2xl group-hover:scale-105 group-hover:border-slate-600 transition-all shadow-inner">
                            {entry.avatar}
                          </div>
                          <div>
                            <div className="text-white font-bold text-[15px]">{entry.username}</div>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium uppercase tracking-wide">PQC Specialist</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-cyan-400 font-bold tracking-wide">{entry.score.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-slate-300 font-bold">{entry.completedAssessments}</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {Array(entry.achievements).fill(0).map((_, i) => (
                            <span key={i} className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20 uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]"></span>
                          {entry.lastActive}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Threads Tab */}
        {activeTab === 'threads' && (
          <div className="space-y-6">
            {/* Category Filter & Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    !selectedCategory
                      ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                        : 'bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-gray-200'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowNewThreadForm(!showNewThreadForm)}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2 justify-center"
              >
                <MessageSquare className="w-4 h-4" />
                {showNewThreadForm ? 'Cancel' : 'New Thread'}
              </button>
            </div>

            {/* New Thread Form */}
            {showNewThreadForm && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                <h3 className="text-xl font-bold text-white mb-4">Create a New Thread</h3>
                <form onSubmit={handleCreateThread} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={newThreadTitle}
                      onChange={e => setNewThreadTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="What's on your mind?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                    <select
                      value={newThreadCategory}
                      onChange={e => setNewThreadCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Content</label>
                    <textarea
                      required
                      rows={4}
                      value={newThreadContent}
                      onChange={e => setNewThreadContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                      placeholder="Describe your question or share your thoughts..."
                    ></textarea>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-2"
                    >
                      {isSubmitting ? 'Posting...' : 'Post Thread'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Threads List */}
            <div className="space-y-4">
              {threads.map(thread => (
                <div
                  key={thread.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{thread.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{thread.author.avatar}</span>
                        <span className="text-gray-300">{thread.author.username}</span>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-gray-400">
                          {thread.author.knowledgeLevel}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded font-semibold ${
                      thread.category === 'question' ? 'bg-blue-900 text-blue-200' :
                      thread.category === 'guide' ? 'bg-green-900 text-green-200' :
                      thread.category === 'news' ? 'bg-purple-900 text-purple-200' :
                      'bg-gray-900 text-gray-200'
                    }`}>
                      {thread.category.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-400 mb-3">{thread.content}</p>

                  <div className="flex gap-4 flex-wrap mb-3">
                    {thread.tags.map(tag => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-xs bg-slate-700 text-gray-300 px-2 py-1 rounded"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-400 border-t border-slate-700 pt-4 mt-2">
                    <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      {thread.replies} replies
                    </button>
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      {thread.views} views
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpvote(thread.id);
                      }}
                      className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors group"
                    >
                      <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="group-hover:font-medium">{thread.upvotes} upvotes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending Tab */}
        {activeTab === 'trending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trending Topics */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                Trending Topics
              </h2>
              <div className="space-y-3">
                {trending.map((topic, idx) => (
                  <div
                    key={topic.tag}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-blue-400">#{idx + 1}</span>
                      <div>
                        <p className="text-white font-semibold">{topic.tag}</p>
                        <p className="text-sm text-gray-400">{topic.count} discussions</p>
                      </div>
                    </div>
                    <Tag className="w-5 h-5 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements Showcase */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Top Achievements</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <span className="text-3xl">🥇</span>
                  <div>
                    <p className="text-white font-semibold">Compliance Expert</p>
                    <p className="text-sm text-gray-400">Pass all NIST standards</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <span className="text-3xl">🏆</span>
                  <div>
                    <p className="text-white font-semibold">Migration Champion</p>
                    <p className="text-sm text-gray-400">Complete full PQC migration</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <span className="text-3xl">⭐</span>
                  <div>
                    <p className="text-white font-semibold">Community Hero</p>
                    <p className="text-sm text-gray-400">Help 10 community members</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                  <span className="text-3xl">🌱</span>
                  <div>
                    <p className="text-white font-semibold">Quantum Rookie</p>
                    <p className="text-sm text-gray-400">Complete first assessment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
