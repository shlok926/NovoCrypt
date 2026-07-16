import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { complianceService } from '@/services/complianceCommunityService';
import type { ComplianceStandard, ComplianceCheck } from '@/types/compliance-community-chatbot.types';

export default function ComplianceChecker() {
  const [standards, setStandards] = useState<ComplianceStandard[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [organizationName, setOrganizationName] = useState('');
  const [algorithms, setAlgorithms] = useState<string[]>([]);
  const [result, setResult] = useState<ComplianceCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const AVAILABLE_ALGORITHMS = [
    'RSA-2048', 'RSA-4096', 'ECDSA', 'SHA-1', 'SHA-256',
    'AES-128', 'AES-256', 'DES', 'MD5', 'ML-KEM', 'ML-DSA', 'SLH-DSA'
  ];

  useEffect(() => {
    const loadStandards = async () => {
      try {
        const stds = await complianceService.getStandards();
        setStandards(stds);
      } catch (err: any) {
        setError('Failed to load compliance standards. Please verify your connection.');
      }
    };
    loadStandards();
  }, []);

  const toggleStandard = (standardId: string) => {
    setSelectedStandards(prev =>
      prev.includes(standardId)
        ? prev.filter(s => s !== standardId)
        : [...prev, standardId]
    );
  };

  const toggleAlgorithm = (algo: string) => {
    setAlgorithms(prev =>
      prev.includes(algo)
        ? prev.filter(a => a !== algo)
        : [...prev, algo]
    );
  };

  const handleCheck = async () => {
    if (!organizationName || algorithms.length === 0 || selectedStandards.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const checkResult = await complianceService.checkCompliance({
        organizationName,
        currentAlgorithms: algorithms,
        targetStandards: selectedStandards
      });
      if (checkResult) {
        setResult(checkResult);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate compliance report.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-900';
      case 'high': return 'bg-orange-900';
      case 'medium': return 'bg-yellow-900';
      case 'low': return 'bg-blue-900';
      default: return 'bg-slate-900';
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold text-white mb-2">Compliance Assessment Results</h1>
            <p className="text-gray-300 text-lg">{result.organizationName}</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-blue-900 to-slate-800 border border-blue-700 rounded-lg p-8 mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-400 mb-2">{result.overallCompliance}%</div>
              <p className="text-gray-300 text-lg">Overall Compliance Score</p>
              <p className="text-gray-400 text-sm mt-2">Assessment completed on {new Date(result.timestamp).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Standard Results */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-white">Standard Compliance</h2>
            {result.results.map(stdResult => (
              <div key={stdResult.standardId} className={`border rounded-lg p-6 ${stdResult.compliant ? 'bg-slate-800 border-green-700' : 'bg-slate-800 border-red-700'}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {stdResult.compliant ? (
                      <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-white">{stdResult.standardName}</h3>
                      <p className="text-gray-400 text-sm mt-1">Compliance Score: <span className="font-semibold text-white">{stdResult.score}%</span></p>
                    </div>
                  </div>
                </div>

                {/* Gaps */}
                {stdResult.gaps.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-300 font-semibold mb-3">Compliance Gaps:</p>
                    <div className="space-y-3">
                      {stdResult.gaps.map((gap, idx) => (
                        <div key={idx} className={`${getSeverityBg(gap.severity)} border border-opacity-30 rounded p-4`}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className={`text-sm font-bold ${getSeverityColor(gap.severity)}`}>{gap.severity.toUpperCase()}</span>
                            <span className="text-gray-300 text-sm font-semibold">{gap.requirement}</span>
                          </div>
                          <p className="text-gray-400 text-sm mb-2"><strong>Current:</strong> {gap.currentState}</p>
                          <p className="text-gray-400 text-sm mb-3"><strong>Required:</strong> {gap.requiredState}</p>
                          <p className="text-gray-300 text-xs font-semibold mb-2">Remediation Steps:</p>
                          <ul className="space-y-1">
                            {gap.remediationSteps.map((step, i) => (
                              <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                                <span className="text-blue-400 mt-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {stdResult.recommendations.length > 0 && (
                  <div>
                    <p className="text-gray-300 font-semibold mb-2">Recommendations:</p>
                    <ul className="space-y-1">
                      {stdResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-gray-400 text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setResult(null)}
              className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition flex items-center gap-2"
            >
              New Assessment
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-2">Compliance Checker</h1>
          <p className="text-gray-300 text-lg">
            Validate your cryptographic implementations against compliance standards
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-400 w-6 h-6 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}
        {/* Organization Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <label className="block text-gray-300 font-semibold mb-3">Organization Name</label>
          <input
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Your organization name"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Current Cryptography */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <label className="block text-gray-300 font-semibold mb-4">Current Cryptographic Algorithms</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_ALGORITHMS.map(algo => (
              <label
                key={algo}
                className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                  algorithms.includes(algo)
                    ? 'bg-blue-900 border-blue-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
              >
                <input
                  type="checkbox"
                  checked={algorithms.includes(algo)}
                  onChange={() => toggleAlgorithm(algo)}
                  className="mr-2"
                />
                <span className="text-white text-sm font-medium">{algo}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Target Standards */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8">
          <label className="block text-gray-300 font-semibold mb-4">Target Compliance Standards</label>
          <div className="space-y-3">
            {standards.map(standard => (
              <label
                key={standard.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedStandards.includes(standard.id)
                    ? 'bg-blue-900 border-blue-500'
                    : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStandards.includes(standard.id)}
                    onChange={() => toggleStandard(standard.id)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-white font-semibold">{standard.name}</p>
                    <p className="text-gray-400 text-sm">{standard.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Check Button */}
        <button
          onClick={handleCheck}
          disabled={loading || !organizationName || algorithms.length === 0 || selectedStandards.length === 0}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-semibold transition flex items-center justify-center gap-2"
        >
          {loading ? 'Checking...' : 'Run Compliance Check'}
          {!loading && <ArrowRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
