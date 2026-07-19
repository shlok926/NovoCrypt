import React, { useState, useEffect } from 'react';
import { assetApi, Asset } from '@/services/assets';
import { scannerApi, ScanResult, ScanFinding } from '@/services/scanner';
import { Shield, Search, FileText, CheckCircle, AlertTriangle, XCircle, Terminal, Download, Globe, Server, FileCode, ArrowRight, Activity, Clock, Plus, FolderGit2, Trash2, RefreshCw } from 'lucide-react';

const Scanner: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // Onboarding Modal State
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetData, setNewAssetData] = useState({ name: '', assetType: 'ssl', domain: '', repositoryUrl: '' });

  // Scan State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [activeFinding, setActiveFinding] = useState<ScanFinding | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await assetApi.list();
      setAssets(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAsset = async () => {
    if (!newAssetData.name || !newAssetData.assetType) return;
    try {
      const payload: any = { name: newAssetData.name, assetType: newAssetData.assetType };
      if (newAssetData.assetType === 'ssl' || newAssetData.assetType === 'website') payload.domain = newAssetData.domain;
      if (newAssetData.assetType === 'github' || newAssetData.assetType === 'git') payload.repositoryUrl = newAssetData.repositoryUrl;
      
      const response = await assetApi.create(payload);
      setIsAddingAsset(false);
      setNewAssetData({ name: '', assetType: 'ssl', domain: '', repositoryUrl: '' });
      await fetchAssets();
      setSelectedAsset(response.data);
    } catch (error) {
      console.error('Failed to create asset', error);
      alert('Failed to create asset');
    }
  };

  const handleScan = async (asset: Asset) => {
    setIsScanning(true);
    setScanResult(null);
    setActiveFinding(null);
    setSelectedAsset(asset);

    try {
      setScanStatus('Preparing Workspace...');
      await new Promise(r => setTimeout(r, 500));
      
      setScanStatus('Initializing Engine...');
      await new Promise(r => setTimeout(r, 800));
      
      setScanStatus('Analyzing Asset...');
      
      let response;
      if (asset.assetType === 'ssl' || asset.assetType === 'website') {
        response = await scannerApi.scanUrl(asset.domain!, asset.id);
      } else {
        // Mock code scan using URL/repo as input for demo
        response = await scannerApi.scanCode(asset.repositoryUrl || 'const rsa = new RSA(2048);', 'index.js', asset.id);
      }

      setScanStatus('Finalizing Risk Posture...');
      await new Promise(r => setTimeout(r, 500));
      
      setScanResult(response.data);
      await fetchAssets(); // Refresh assets to show updated scores
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
              Enterprise asset inventory, continuous scanning, and post-quantum compliance.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            {scanResult && (
              <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center text-sm font-medium transition-colors border border-slate-700">
                <FileText className="w-4 h-4 mr-2" /> PDF Report
              </button>
            )}
            <button 
              onClick={() => setIsAddingAsset(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-2" /> Onboard Asset
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          
          {/* Left Column: Asset Inventory */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[800px]">
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Asset Inventory</h2>
                <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs font-bold border border-blue-500/20">{assets.length}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
                {assets.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    No assets onboarded. Click 'Onboard Asset' to begin.
                  </div>
                ) : (
                  assets.map(asset => (
                    <div 
                      key={asset.id} 
                      onClick={() => { setSelectedAsset(asset); setScanResult(null); }}
                      className={`p-4 hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedAsset?.id === asset.id ? 'bg-slate-800 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center font-medium text-slate-200">
                          {asset.assetType === 'ssl' || asset.assetType === 'website' ? <Globe className="w-4 h-4 mr-2 text-slate-400" /> : <FolderGit2 className="w-4 h-4 mr-2 text-slate-400" />}
                          <span className="truncate w-32">{asset.name}</span>
                        </div>
                        {asset.currentRiskScore !== null && asset.currentRiskScore !== undefined && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${asset.currentRiskScore < 50 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : asset.currentRiskScore < 80 ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                            {asset.currentRiskScore}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        {asset.domain || asset.repositoryUrl || 'No target configured'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Asset Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedAsset ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-12 flex flex-col justify-center items-center text-center min-h-[500px]">
                <Server className="w-16 h-16 text-slate-700 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Asset Selected</h2>
                <p className="text-slate-400 max-w-md">Select an asset from the inventory to view its security posture, or onboard a new application to begin monitoring.</p>
              </div>
            ) : (
              <>
                {/* Asset Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 border border-slate-700 px-2 py-1 rounded bg-slate-800">{selectedAsset.assetType}</span>
                        <span className="text-xs text-slate-400">ID: {selectedAsset.id.split('-')[0]}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white">{selectedAsset.name}</h2>
                      <p className="text-slate-400 font-mono text-sm mt-1">{selectedAsset.domain || selectedAsset.repositoryUrl}</p>
                    </div>
                    <button 
                      onClick={() => handleScan(selectedAsset)}
                      disabled={isScanning}
                      className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold flex items-center transition-colors shadow-lg shadow-cyan-900/20"
                    >
                      {isScanning ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> {scanStatus}</>
                      ) : (
                        <><Activity className="w-4 h-4 mr-2" /> Run Analysis</>
                      )}
                    </button>
                  </div>

                  {/* Asset Core Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Status</span>
                      <span className="flex items-center text-emerald-400 text-sm font-medium"><CheckCircle className="w-4 h-4 mr-1"/> Active Monitored</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Last Scan</span>
                      <span className="text-slate-200 text-sm">{selectedAsset.lastScanAt ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(selectedAsset.lastScanAt)) : 'Never'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Risk Score</span>
                      <span className={`text-xl font-bold ${!selectedAsset.currentRiskScore ? 'text-slate-600' : selectedAsset.currentRiskScore < 50 ? 'text-red-400' : selectedAsset.currentRiskScore < 80 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {selectedAsset.currentRiskScore || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs uppercase font-semibold mb-1">Quantum Readiness</span>
                      <span className={`text-xl font-bold ${!selectedAsset.currentQuantumReadiness ? 'text-slate-600' : selectedAsset.currentQuantumReadiness < 50 ? 'text-red-400' : selectedAsset.currentQuantumReadiness < 80 ? 'text-orange-400' : 'text-emerald-400'}`}>
                        {selectedAsset.currentQuantumReadiness || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Scan Results Overlay */}
                {scanResult && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-white">Latest Security Findings</h2>
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
                        <p className="text-slate-400 max-w-md">The scan completed successfully and no cryptographic issues or quantum risks were detected.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Finding Details Panel */}
                {activeFinding && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
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
            )}
          </div>
        </div>

      </div>

      {/* Onboard Asset Modal */}
      {isAddingAsset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Onboard New Asset</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Asset Name</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., Core Banking API"
                  value={newAssetData.name}
                  onChange={e => setNewAssetData({...newAssetData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Asset Type</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                  value={newAssetData.assetType}
                  onChange={e => setNewAssetData({...newAssetData, assetType: e.target.value})}
                >
                  <option value="ssl">SSL/TLS Domain</option>
                  <option value="website">Website</option>
                  <option value="github">GitHub Repository</option>
                  <option value="git">Generic Git URL</option>
                </select>
              </div>

              {['ssl', 'website'].includes(newAssetData.assetType) ? (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Domain URL</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="example.com"
                    value={newAssetData.domain}
                    onChange={e => setNewAssetData({...newAssetData, domain: e.target.value})}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Repository URL</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="https://github.com/org/repo"
                    value={newAssetData.repositoryUrl}
                    onChange={e => setNewAssetData({...newAssetData, repositoryUrl: e.target.value})}
                  />
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddingAsset(false)}
                className="px-4 py-2 text-slate-400 hover:text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateAsset}
                disabled={!newAssetData.name || (!newAssetData.domain && !newAssetData.repositoryUrl)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                Onboard Asset
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Scanner;
