import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import scannerService from '@/services/scannerService';
import { ScanResult, SSLVulnerability } from '@/types/scanner.types';

export const SSLScanner: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) {
      setError('Please enter a domain');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const scanResult = await scannerService.scanSSLCertificate(domain);
      setResult(scanResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to scan SSL certificate'
      );
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/50 text-red-200 border-red-500/50';
      case 'high':
        return 'bg-orange-900/50 text-orange-200 border-orange-500/50';
      case 'medium':
        return 'bg-yellow-900/50 text-yellow-200 border-yellow-500/50';
      case 'low':
        return 'bg-blue-900/50 text-blue-200 border-blue-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'medium':
        return <Shield className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">
          🔐 SSL/TLS Certificate Scanner
        </h3>

        <form onSubmit={handleScan} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Domain Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g., google.com, example.org"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Scan'
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-white">Scan Results</h4>
                <p className="text-sm text-gray-400">{domain}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {result.riskScore}%
                </div>
                <p className="text-xs text-gray-400">Risk Score</p>
              </div>
            </div>
          </div>

          {result.vulnerabilities && result.vulnerabilities.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-semibold text-white">
                Vulnerabilities Found: {result.vulnerabilities.length}
              </h4>
              {(result.vulnerabilities as SSLVulnerability[]).map(
                (vuln, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border rounded-lg ${getSeverityColor(
                      vuln.severity
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      {getSeverityIcon(vuln.severity)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-semibold text-white">{vuln.type}</h5>
                          <span className="text-xs px-2 py-1 bg-slate-800 rounded font-medium text-slate-300">
                            {vuln.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{vuln.description}</p>
                        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                          <p className="text-sm font-medium">
                            💡 Recommendation:
                          </p>
                          <p className="text-sm mt-1">{vuln.recommendation}</p>
                        </div>
                        {vuln.quantumRisk && (
                          <div className="mt-2 text-xs font-medium opacity-75">
                            ⚠️ Quantum Risk: Yes
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>No vulnerabilities detected. Certificate looks secure!</span>
              </div>
            </div>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h5 className="font-semibold text-white mb-2">
                📋 Recommendations
              </h5>
              <ul className="space-y-1">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex gap-2">
                    <span>✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
