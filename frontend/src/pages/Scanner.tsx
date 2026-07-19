import React, { useState, useEffect } from 'react';
import { scannerApi, ScanResult, ScanFinding } from '@/services/scanner';
import { Shield, Search, FileText, CheckCircle, AlertTriangle, XCircle, Terminal, Download, Globe, Server, FileCode, ArrowRight, Activity, Clock, Trash2, RefreshCw } from 'lucide-react';

type ScanTarget = 'code' | 'github' | 'url' | 'zip' | 'website' | 'ssl' | 'config';

const Scanner: React.FC = () => {
  const [targetType, setTargetType] = useState<ScanTarget>('code' as ScanTarget); // Use 'code' instead of specific Github/ZIP for now to match backend
  const [targetInput, setTargetInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [activeFinding, setActiveFinding] = useState<ScanFinding | null>(null);
  
  // UI Scan State
  const [scanStatus, setScanStatus] = useState<string>('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await scannerApi.getHistory(5);
      setScanHistory(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleScan = async () => {
    if (!targetInput) return;
    setIsScanning(true);
    setScanResult(null);
    setActiveFinding(null);

    try {
      setScanStatus('Preparing Scan...');
      await new Promise(r => setTimeout(r, 500));
      
      setScanStatus('Detecting Target & Initializing Detectors...');
      await new Promise(r => setTimeout(r, 800));
      
      setScanStatus('Running Analysis...');
      
      let response;
      if (targetType === 'ssl' || targetType === 'website') {
        response = await scannerApi.scanUrl(targetInput);
      } else {
        response = await scannerApi.scanCode(targetInput, 'input.js');
      }

      setScanStatus('Calculating Risk...');
      await new Promise(r => setTimeout(r, 500));
      
      setScanResult(response.data);
      fetchHistory();
    } catch (error) {
      console.error("Scan failed", error);
      alert("Scan failed. Please check the console for details.");
    } finally {
      setIsScanning(false);
      setScanStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-slate-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <Shield className="w-8 h-8 mr-3 text-blue-500" />
              Security Workspace
            </h1>
            <p className="text-lg text-slate-400">
              Your centralized command center for cryptographic discovery and post-quantum migration.
            </p>
          </div>
          {scanResult && (
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center text-sm font-medium transition-colors border border-slate-700">
                <Download className="w-4 h-4 mr-2" /> JSON
              </button>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center text-sm font-medium transition-colors">
                <FileText className="w-4 h-4 mr-2" /> PDF Report
              </button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column: Configuration & History */}
          <div className="space-y-6">
            
            {/* Scan Configuration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
                <h2 className="text-lg font-semibold text-white">Scan Target</h2>
              </div>
              <div className="p-6 space-y-5">
                
                {/* Target Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Target Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setTargetType('code' as any)}
                      className={`p-3 rounded-lg border text-sm flex items-center ${targetType === 'code' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                    >
                      <FileCode className="w-4 h-4 mr-2" /> Code / Text
                    </button>
                    <button 
                      onClick={() => setTargetType('ssl')}
                      className={`p-3 rounded-lg border text-sm flex items-center ${targetType === 'ssl' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                    >
                      <Globe className="w-4 h-4 mr-2" /> URL / SSL
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">More targets (GitHub, ZIP, Cloud IaC) are provisioned via enterprise plugins.</p>
                </div>

                {/* Target Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Target Input</label>
                  {targetType === 'ssl' ? (
                    <input 
                      type="text"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., example.com"
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                    />
                  ) : (
                    <textarea 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 font-mono text-sm focus:outline-none focus:border-blue-500 h-32"
                      placeholder="Paste code snippet here..."
                      value={targetInput}
                      onChange={(e) => setTargetInput(e.target.value)}
                    />
                  )}
                </div>

                {/* Advanced Options */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Advanced Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm text-slate-300">
                      <input type="checkbox" className="mr-2 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" defaultChecked />
                      Recursive Scan
                    </label>
                    <label className="flex items-center text-sm text-slate-300">
                      <input type="checkbox" className="mr-2 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" defaultChecked />
                      Include Dependencies
                    </label>
                  </div>
                </div>

                {/* Scan Action */}
                <button 
                  onClick={handleScan}
                  disabled={isScanning || !targetInput}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold flex justify-center items-center transition-colors shadow-lg shadow-blue-900/20"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      {scanStatus}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Run Security Scan
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scan History */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Recent Scans</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {scanHistory.map((scan, i) => (
                  <div key={i} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => fetchHistory()}>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg mr-3 ${scan.riskLevel === 'critical' ? 'bg-red-500/10 text-red-400' : scan.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {scan.scanType === 'code' ? <Terminal className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200 truncate w-32 md:w-48">{scan.inputTarget}</p>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(scan.scannedAt))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${scan.riskLevel === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : scan.riskLevel === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {scan.overallScore}/100
                      </span>
                    </div>
                  </div>
                ))}
                {scanHistory.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No recent scans found.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Results Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            
            {scanResult ? (
              <>
                {/* Score Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-lg">
                    <span className="text-slate-400 text-sm font-medium mb-1">Risk Score</span>
                    <span className={`text-3xl font-bold ${scanResult.overallRiskScore < 50 ? 'text-red-400' : scanResult.overallRiskScore < 80 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {scanResult.overallRiskScore}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-lg">
                    <span className="text-slate-400 text-sm font-medium mb-1">Quantum Risk</span>
                    <span className={`text-3xl font-bold ${scanResult.quantumReadinessScore < 50 ? 'text-red-400' : scanResult.quantumReadinessScore < 80 ? 'text-orange-400' : 'text-emerald-400'}`}>
                      {scanResult.quantumReadinessScore}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-lg">
                    <span className="text-slate-400 text-sm font-medium mb-1">Findings</span>
                    <span className="text-3xl font-bold text-white">
                      {scanResult.metrics.totalFindings}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-center items-center text-center shadow-lg">
                    <span className="text-slate-400 text-sm font-medium mb-1">Algorithms</span>
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {scanResult.algorithmsFound.length > 0 ? scanResult.algorithmsFound.slice(0,2).map(algo => (
                        <span key={algo} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{algo}</span>
                      )) : <span className="text-lg font-bold text-slate-300">-</span>}
                      {scanResult.algorithmsFound.length > 2 && <span className="text-xs text-slate-500">+{scanResult.algorithmsFound.length - 2}</span>}
                    </div>
                  </div>
                </div>

                {/* Findings Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Security Workspace Findings</h2>
                    <div className="flex space-x-2 text-sm">
                      <span className="flex items-center text-red-400"><XCircle className="w-4 h-4 mr-1"/> {scanResult.metrics.critical} Critical</span>
                      <span className="flex items-center text-orange-400"><AlertTriangle className="w-4 h-4 mr-1"/> {scanResult.metrics.high} High</span>
                    </div>
                  </div>
                  
                  {scanResult.findings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-3 font-medium">Severity</th>
                            <th className="px-6 py-3 font-medium">Title</th>
                            <th className="px-6 py-3 font-medium">Algorithm</th>
                            <th className="px-6 py-3 font-medium">Location</th>
                            <th className="px-6 py-3 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {scanResult.findings.map((finding) => (
                            <tr key={finding.id} className={`hover:bg-slate-800/30 transition-colors ${activeFinding?.id === finding.id ? 'bg-slate-800/50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  finding.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  finding.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                  finding.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}>
                                  {finding.severity.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-slate-200">
                                {finding.title}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-400">
                                {finding.algorithm || 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-400 font-mono text-xs">
                                {finding.evidence?.file ? `${finding.evidence.file}:${finding.evidence.line}` : 'Global'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button 
                                  onClick={() => setActiveFinding(finding)}
                                  className="text-blue-400 hover:text-blue-300 flex items-center justify-end w-full"
                                >
                                  Details <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">No Vulnerabilities Found</h3>
                      <p className="text-slate-400 max-w-md">The scan completed successfully and no cryptographic issues or quantum risks were detected in the target.</p>
                    </div>
                  )}
                </div>

                {/* Finding Details Panel */}
                {activeFinding && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            activeFinding.severity === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            activeFinding.severity === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {activeFinding.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-1 rounded">{activeFinding.ruleId}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{activeFinding.title}</h3>
                      </div>
                      <button onClick={() => setActiveFinding(null)} className="text-slate-500 hover:text-slate-300">
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>

                    <p className="text-slate-300 mb-6">{activeFinding.description}</p>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-1 uppercase tracking-wider">Current Risk</h4>
                          <p className="text-sm text-slate-200">{activeFinding.currentRisk}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-1 uppercase tracking-wider">Quantum Risk</h4>
                          <p className="text-sm text-orange-200 bg-orange-950/30 p-3 rounded-lg border border-orange-900/50">{activeFinding.quantumRisk}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-1 uppercase tracking-wider">Recommendation</h4>
                          <p className="text-sm text-emerald-200 bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50">{activeFinding.recommendation}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-400 mb-1 uppercase tracking-wider">Detector Output</h4>
                          <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                            <div>Detector: {activeFinding.detector}</div>
                            <div>Confidence: {activeFinding.confidence}%</div>
                            {activeFinding.algorithm && <div>Algorithm: {activeFinding.algorithm}</div>}
                          </div>
                        </div>
                      </div>
                    </div>

                    {activeFinding.evidence && activeFinding.evidence.snippet && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider flex justify-between items-end">
                          <span>Evidence / Snippet</span>
                          <span className="lowercase normal-case font-mono">{activeFinding.evidence.file}:{activeFinding.evidence.line}</span>
                        </h4>
                        <pre className="bg-[#0d1117] border border-slate-800 p-4 rounded-lg overflow-x-auto text-sm font-mono text-slate-300 shadow-inner">
                          <code>{activeFinding.evidence.snippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-12 flex flex-col justify-center items-center text-center h-full min-h-[500px]">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                  <Search className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Ready to Scan</h2>
                <p className="text-slate-400 max-w-md text-lg mb-8">
                  Select a target on the left to begin analyzing your cryptographic posture and quantum readiness.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                  <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <Shield className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                    <h3 className="font-medium text-white text-sm mb-1">Unified Engine</h3>
                    <p className="text-xs text-slate-400">All targets scan against a central Risk Engine.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <Activity className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                    <h3 className="font-medium text-white text-sm mb-1">Deep Analysis</h3>
                    <p className="text-xs text-slate-400">AST parsing and strict semantic rules.</p>
                  </div>
                  <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                    <Server className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <h3 className="font-medium text-white text-sm mb-1">Extensible</h3>
                    <p className="text-xs text-slate-400">Built to support infinite future detectors.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Scanner;
