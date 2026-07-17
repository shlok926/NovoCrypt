import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import scannerService from '@/services/scannerService';
import { ScannerRecommendations } from '@/types/scanner.types';

export const RecommendationPanel: React.FC = () => {
  const [recommendations, setRecommendations] = useState<ScannerRecommendations | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const recs = await scannerService.getRecommendations();
        setRecommendations(recs);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load recommendations'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!recommendations || !recommendations.vulnerable || !recommendations.safe) {
    return (
      <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
        Unable to load recommendations. Please try refreshing the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">
        🔄 Quantum-Safe Algorithm Migration
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vulnerable Algorithms */}
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h4 className="font-semibold text-red-200">Vulnerable Algorithms</h4>
          </div>
          <div className="space-y-3">
            {recommendations.vulnerable.map((algo, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-800 border border-slate-700 rounded text-sm"
              >
                <div className="font-semibold text-white">{algo.algorithm}</div>
                <p className="text-gray-400 text-xs mt-1">{algo.reason}</p>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      algo.severity === 'critical'
                        ? 'bg-red-900/50 text-red-200'
                        : 'bg-orange-900/50 text-orange-200'
                    }`}
                  >
                    {algo.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe Algorithms */}
        <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h4 className="font-semibold text-emerald-200">
              Recommended Quantum-Safe Alternatives
            </h4>
          </div>
          <div className="space-y-3">
            {recommendations.safe.map((algo, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-800 border border-slate-700 rounded text-sm"
              >
                <div className="font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {algo.algorithm}
                </div>
                <p className="text-gray-400 text-xs mt-1">{algo.description}</p>
                {algo.migrationSteps && algo.migrationSteps.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700">
                    <p className="text-xs font-medium text-gray-300 mb-1">
                      Migration Steps:
                    </p>
                    <ol className="text-xs text-gray-400 space-y-1 ml-4">
                      {algo.migrationSteps.map((step, stepIdx) => (
                        <li key={stepIdx} className="list-decimal">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="font-semibold text-blue-300 mb-2">⏱️ Migration Timeline</h4>
        <p className="text-blue-200 text-sm">{recommendations.timeline}</p>
      </div>

      {/* Action Items */}
      <div className="p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
        <h4 className="font-semibold text-amber-400 mb-3">📋 Action Items</h4>
        <ul className="space-y-2 text-sm text-amber-200">
          <li className="flex gap-2">
            <span>1.</span>
            <span>Audit your codebase for deprecated cryptographic algorithms</span>
          </li>
          <li className="flex gap-2">
            <span>2.</span>
            <span>
              Begin migration to post-quantum cryptography (PQC) algorithms
            </span>
          </li>
          <li className="flex gap-2">
            <span>3.</span>
            <span>Test new implementations thoroughly in staging environment</span>
          </li>
          <li className="flex gap-2">
            <span>4.</span>
            <span>Deploy updates to production with monitoring</span>
          </li>
          <li className="flex gap-2">
            <span>5.</span>
            <span>
              Establish hybrid cryptography (classical + PQC) during transition
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
