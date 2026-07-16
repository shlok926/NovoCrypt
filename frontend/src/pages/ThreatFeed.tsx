import { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, TrendingUp, CheckCircle, BarChart3, Bell, Search } from 'lucide-react';
import { threatService } from '@/services/threatMigrationService';
import { ThreatIntelligence, Severity, ThreatCategory } from '@/types/threat-migration.types';
import ThreatAnalytics from './components/ThreatAnalytics';
import AlertSubscriptions from './components/AlertSubscriptions';
import SearchAndExport from './components/SearchAndExport';

export default function ThreatFeed() {
  const [activeTab, setActiveTab] = useState<'live' | 'analytics' | 'alerts' | 'search'>('live');
  const [threats, setThreats] = useState<ThreatIntelligence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<ThreatCategory | 'all'>('all');
  const [stats, setStats] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadThreats = async () => {
      try {
        setLoading(true);
        setError(null);
        const filteredThreats = await threatService.getAllThreats({
          severity: selectedSeverity === 'all' ? undefined : selectedSeverity,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          limit: 50
        });
        setThreats(filteredThreats);

        const statistics = await threatService.getThreatStatistics();
        setStats(statistics);
      } catch (err: any) {
        setError('Failed to fetch threat intelligence. Please verify your connection.');
      } finally {
        setLoading(false);
      }
    };

    loadThreats();
  }, [selectedSeverity, selectedCategory]);

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-100';
      case 'high':
        return 'bg-orange-900 text-orange-100';
      case 'medium':
        return 'bg-yellow-900 text-yellow-100';
      case 'low':
        return 'bg-blue-900 text-blue-100';
      default:
        return 'bg-gray-700';
    }
  };

  const getSeverityIcon = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      case 'medium':
        return <Info className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: ThreatCategory) => {
    switch (category) {
      case 'quantum-progress':
        return 'text-purple-400';
      case 'standards':
        return 'text-blue-400';
      case 'attack':
        return 'text-red-400';
      case 'vulnerability':
        return 'text-orange-400';
      case 'regulation':
        return 'text-indigo-400';
      case 'trend':
        return 'text-cyan-400';
      case 'positive-news':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Threat Intelligence Feed</h1>
          </div>
          <p className="text-gray-300 text-lg">
            Real-time quantum & cryptography threat alerts, government advisories, and vendor updates
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-400 w-6 h-6 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Total Threats</div>
              <div className="text-3xl font-bold text-white">{stats.totalThreats}</div>
            </div>
            <div className="bg-red-900 border border-red-700 rounded-lg p-4">
              <div className="text-red-200 text-sm">Critical</div>
              <div className="text-3xl font-bold text-red-100">{stats.bySeverity.critical}</div>
            </div>
            <div className="bg-orange-900 border border-orange-700 rounded-lg p-4">
              <div className="text-orange-200 text-sm">High</div>
              <div className="text-3xl font-bold text-orange-100">{stats.bySeverity.high}</div>
            </div>
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
              <div className="text-blue-200 text-sm">Medium/Low</div>
              <div className="text-3xl font-bold text-blue-100">
                {stats.bySeverity.medium + stats.bySeverity.low}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'live'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Live Threats
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'alerts'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-2" />
            My Alerts
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-cyan-500 text-cyan-300'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Search & Export
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              {showFilters ? '✓ Filters Open' : '⚙️ Show Filters'}
            </button>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Severity</label>
                  <select
                    value={selectedSeverity}
                    onChange={(e) => setSelectedSeverity(e.target.value as Severity | 'all')}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical Only</option>
                    <option value="high">High & Critical</option>
                    <option value="medium">Medium & Above</option>
                    <option value="low">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ThreatCategory | 'all')}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="quantum-progress">Quantum Progress</option>
                    <option value="standards">Standards</option>
                    <option value="attack">Attacks</option>
                    <option value="vulnerability">Vulnerabilities</option>
                    <option value="regulation">Regulations</option>
                    <option value="trend">Trends</option>
                    <option value="positive-news">Positive News</option>
                  </select>
                </div>
              </div>
            )}

            {/* Threats List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                <p className="text-gray-400 mt-4">Loading threats...</p>
              </div>
            ) : threats.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No threats found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {threats.map((threat) => (
                  <div
                    key={threat.id}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/30 transition"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-2 rounded ${getSeverityColor(threat.severity)}`}>
                        {getSeverityIcon(threat.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-white">{threat.title}</h3>
                          <div className="flex gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                              {threat.severity.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium bg-slate-700 text-gray-300 ${getCategoryColor(threat.category)}`}>
                              {threat.category.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-3">{threat.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-500 text-xs font-semibold mb-1">Affected Algorithms</p>
                            <div className="flex flex-wrap gap-2">
                              {threat.affectedAlgorithms.map((algo) => (
                                <span key={algo} className="px-2 py-1 bg-slate-700 text-gray-200 text-xs rounded">
                                  {algo}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-500 text-xs font-semibold mb-1">Impact</p>
                            <p className="text-gray-300 text-sm">{threat.impact}</p>
                          </div>
                        </div>

                        <div className="bg-slate-900 rounded p-3 mb-4">
                          <p className="text-yellow-300 text-sm font-semibold mb-1">Recommendation</p>
                          <p className="text-gray-300 text-sm">{threat.recommendation}</p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Source: {threat.source}</span>
                          <span>{new Date(threat.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && <ThreatAnalytics />}
        {activeTab === 'alerts' && <AlertSubscriptions />}
        {activeTab === 'search' && <SearchAndExport />}
      </div>
    </div>
  );
}
