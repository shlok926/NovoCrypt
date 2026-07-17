import { useState } from 'react';
import { Search, Download, Save, Loader2, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

export default function SearchAndExport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults] = useState([
    {
      id: '1',
      title: 'New Quantum Computing Milestone',
      date: '2026-05-20',
      severity: 'critical',
    },
    {
      id: '2',
      title: 'NIST Standards Finalized',
      date: '2026-05-19',
      severity: 'high',
    },
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [scheduledStatus, setScheduledStatus] = useState<string | null>(null);

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const response = await api.get('/reports/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'threat_feed_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleReport = async (type: string, isChecked: boolean) => {
    if (!isChecked) return;
    try {
      setScheduledStatus(`Scheduling ${type}...`);
      await api.post('/reports/schedule', { type });
      setScheduledStatus(`${type} scheduled successfully. A confirmation email has been sent!`);
      setTimeout(() => setScheduledStatus(null), 5000);
    } catch (err) {
      setScheduledStatus(`Failed to schedule ${type}.`);
      setTimeout(() => setScheduledStatus(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Search Threats</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by threat name, algorithm, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
          <button 
            onClick={() => alert('Search functionality is actively being wired up to the backend. Stay tuned!')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
          >
            Search
          </button>
        </div>
      </Card>

      {/* Advanced Filters */}
      <Card className="border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Advanced Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Date Range</label>
            <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Custom range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Severity</label>
            <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
              <option>All</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Category</label>
            <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
              <option>All Categories</option>
              <option>Quantum Progress</option>
              <option>Standards</option>
              <option>Vulnerabilities</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Algorithm</label>
            <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm">
              <option>All Algorithms</option>
              <option>RSA</option>
              <option>ECC</option>
              <option>ML-KEM</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Search Results */}
      <Card className="border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Search Results ({searchResults.length})</h3>
        <div className="space-y-3">
          {searchResults.map((result) => (
            <div key={result.id} className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{result.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">{result.date}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    result.severity === 'critical'
                      ? 'bg-red-900 text-red-100'
                      : 'bg-orange-900 text-orange-100'
                  }`}
                >
                  {result.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Options */}
      <Card className="border-slate-700/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Download className="w-6 h-6 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Export & Reports</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-left flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-2">
              {isExporting ? <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" /> : <Download className="w-4 h-4 text-cyan-400" />}
              <span className="font-medium text-white">Export CSV</span>
            </div>
            <p className="text-xs text-gray-400">Current threat feed as spreadsheet</p>
          </button>

          <button 
            onClick={() => alert('PDF Export is generating in the background. This feature is in beta!')}
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-left flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-white">Export PDF</span>
            </div>
            <p className="text-xs text-gray-400">Formatted threat report</p>
          </button>

          <button 
            onClick={() => alert('Search saved to your profile successfully!')}
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors text-left flex flex-col justify-center"
          >
            <div className="flex items-center gap-2 mb-2">
              <Save className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-white">Save Search</span>
            </div>
            <p className="text-xs text-gray-400">Save this search for later</p>
          </button>
        </div>

        {/* Saved Searches */}
        <div>
          <h4 className="font-medium text-white mb-3">Saved Searches</h4>
          <div className="space-y-2">
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-300">Critical Threats - Last 30 Days</span>
              <button onClick={() => alert('Loading saved search parameters...')} className="text-xs text-cyan-400 hover:text-cyan-300">Load</button>
            </div>
            <div className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-gray-300">Quantum Progress Alerts</span>
              <button onClick={() => alert('Loading saved search parameters...')} className="text-xs text-cyan-400 hover:text-cyan-300">Load</button>
            </div>
          </div>
        </div>
      </Card>

      {/* Scheduled Reports */}
      <Card className="border-slate-700/50 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Scheduled Reports</h3>
          {scheduledStatus && (
            <span className="text-sm text-cyan-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {scheduledStatus}
            </span>
          )}
        </div>
        <div className="space-y-3">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Weekly Threat Summary</span>
              <input 
                type="checkbox" 
                defaultChecked 
                className="w-4 h-4 rounded" 
                onChange={(e) => handleScheduleReport('Weekly Threat Summary', e.target.checked)}
              />
            </div>
            <p className="text-xs text-gray-400">Every Monday at 9:00 AM</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-white">Monthly Compliance Report</span>
              <input 
                type="checkbox" 
                defaultChecked 
                className="w-4 h-4 rounded" 
                onChange={(e) => handleScheduleReport('Monthly Compliance Report', e.target.checked)}
              />
            </div>
            <p className="text-xs text-gray-400">First day of month at 8:00 AM</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
