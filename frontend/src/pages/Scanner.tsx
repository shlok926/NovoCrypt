import React, { useState } from 'react';
import { Tabs } from '@/components/ui/Tabs';
import { SSLScanner } from '@/components/features/Scanner/SSLScanner';
import { CodeScanner } from '@/components/features/Scanner/CodeScanner';
import { RecommendationPanel } from '@/components/features/Scanner/RecommendationPanel';

const Scanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ssl');

  const tabs = [
    {
      label: 'SSL/TLS Certificate',
      value: 'ssl',
      content: <SSLScanner />,
    },
    {
      label: 'Code Scan',
      value: 'code',
      content: <CodeScanner />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 border-b border-slate-800 pb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔍 Security Scanner
          </h1>
          <p className="text-lg text-gray-400">
            Identify cryptographic vulnerabilities and migration paths to quantum-safe algorithms
          </p>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Scanner Tabs */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-lg p-6">
              <Tabs tabs={tabs} defaultValue={activeTab} onChange={setActiveTab} />
            </div>
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                ℹ️ How Scanner Works
              </h3>
              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <h4 className="font-semibold text-blue-400 mb-1">
                    🔐 SSL/TLS Scanner
                  </h4>
                  <p>Analyzes SSL certificates for quantum vulnerabilities</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-400 mb-1">
                    🔍 Code Scanner
                  </h4>
                  <p>Detects deprecated cryptographic patterns in code</p>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-xs text-gray-400">
                    ⚠️ <strong>Beta:</strong> Scanner provides security guidance.
                    Always validate results with security professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-lg p-6">
          <RecommendationPanel />
        </div>

        {/* Footer Info */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
            <div className="font-semibold text-emerald-400 mb-1">✓ NIST Compliant</div>
            <p className="text-sm text-emerald-200/70">
              Scanner follows NIST Post-Quantum Cryptography standards
            </p>
          </div>
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="font-semibold text-blue-400 mb-1">🔄 Regular Updates</div>
            <p className="text-sm text-blue-200/70">
              Threat database updated with latest vulnerabilities
            </p>
          </div>
          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="font-semibold text-purple-400 mb-1">
              🛡️ Always Private
            </div>
            <p className="text-sm text-purple-200/70">
              Your scans are not logged or stored on our servers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
