import React, { useState, useEffect } from 'react';
import { assetApi, Asset, AssetEvent } from '@/services/assets';
import { scannerApi, ScanResult, ScanFinding } from '@/services/scanner';
import { jobApi, Job } from '@/services/jobs';
import { workflowApi, Workflow, WorkflowRun } from '@/services/workflows';
import { correlationApi, ThreatCorrelation } from '@/services/correlations';
import { migrationApi, MigrationPlan } from '@/services/migrations';
import { Shield, Search, FileText, CheckCircle, AlertTriangle, XCircle, Terminal, Download, Globe, Server, FileCode, ArrowRight, Activity, Clock, Plus, FolderGit2, Trash2, RefreshCw, Layers, GitMerge, CircleDashed, BrainCircuit, Route, Settings2 } from 'lucide-react';

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

  // Timeline State
  const [activeTab, setActiveTab] = useState<'timeline' | 'findings' | 'jobs' | 'intelligence' | 'migration'>('timeline');
  const [timelineEvents, setTimelineEvents] = useState<AssetEvent[]>([]);

  // Jobs State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  // Workflow State
  const [activeWorkflowRunId, setActiveWorkflowRunId] = useState<string | null>(null);
  const [activeWorkflowRun, setActiveWorkflowRun] = useState<WorkflowRun | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);

  // Threat Correlation State
  const [correlations, setCorrelations] = useState<ThreatCorrelation[]>([]);

  // Migration Plan State
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(null);

  useEffect(() => {
    fetchAssets();
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await workflowApi.listTemplates();
      setAvailableWorkflows(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeJobId) {
      interval = setInterval(async () => {
        try {
          const res = await jobApi.get(activeJobId);
          setActiveJob(res.data);
          
          if (res.data.jobStatus === 'completed' || res.data.jobStatus === 'failed') {
            setIsScanning(false);
            setActiveJobId(null);
            fetchAssets();
            if (selectedAsset) fetchTimeline(selectedAsset.id);
            setActiveTab('timeline'); // Switch to timeline to show snapshot
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeJobId, selectedAsset]);

  // Polling for Workflow Run
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeWorkflowRunId) {
      interval = setInterval(async () => {
        try {
          const res = await workflowApi.getRun(activeWorkflowRunId);
          setActiveWorkflowRun(res.data);
          
          if (res.data.status === 'completed' || res.data.status === 'failed' || res.data.status === 'aborted') {
            setIsScanning(false);
            setActiveWorkflowRunId(null);
            fetchAssets();
            if (selectedAsset) fetchTimeline(selectedAsset.id);
            setActiveTab('timeline'); 
          }
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeWorkflowRunId, selectedAsset]);

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

  const handleRunWorkflow = async (workflowId: string, asset: Asset) => {
    setIsScanning(true);
    setScanResult(null);
    setActiveFinding(null);
    setSelectedAsset(asset);
    setActiveTab('jobs');

    try {
      setScanStatus('Initializing Workflow...');
      const response = await workflowApi.runWorkflow(workflowId, asset.id, { 
        targetType: asset.assetType === 'ssl' || asset.assetType === 'website' ? 'url' : 'code', 
        target: asset.domain || asset.repositoryUrl 
      });
      setActiveWorkflowRunId(response.data.runId);
      setScanStatus('Workflow Orchestrating...');
    } catch (error) {
      console.error("Workflow failed", error);
      alert("Failed to start workflow. Please check the console for details.");
      setIsScanning(false);
    }
  };

  const fetchTimeline = async (assetId: string) => {
    try {
      const response = await assetApi.getTimeline(assetId);
      setTimelineEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch timeline', error);
    }
  };

  const fetchCorrelations = async (assetId: string) => {
    try {
      const res = await correlationApi.getAssetCorrelations(assetId);
      setCorrelations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMigrationPlan = async (assetId: string) => {
    try {
      const res = await migrationApi.getAssetMigration(assetId);
      setMigrationPlan(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectAsset = async (asset: Asset) => {
    setSelectedAsset(asset);
    setActiveTab('timeline');
    fetchTimeline(asset.id);
    fetchCorrelations(asset.id);
    fetchMigrationPlan(asset.id);
    setScanResult(null);
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
                      onClick={() => handleSelectAsset(asset)}
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
                    <div className="relative group">
                      <button 
                        disabled={isScanning || availableWorkflows.length === 0}
                        className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold flex items-center transition-colors shadow-lg shadow-cyan-900/20"
                      >
                        {isScanning ? (
                          <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> {activeWorkflowRun ? `Executing Step ${activeWorkflowRun.currentStep}` : 'Running...'}</>
                        ) : (
                          <><GitMerge className="w-4 h-4 mr-2" /> Run Workflow</>
                        )}
                      </button>
                      
                      {/* Dropdown for workflows */}
                      {!isScanning && availableWorkflows.length > 0 && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                          {availableWorkflows.map(wf => (
                            <button
                              key={wf.id}
                              onClick={() => handleRunWorkflow(wf.id, selectedAsset)}
                              className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700/50 last:border-0"
                            >
                              <div className="font-semibold text-white mb-0.5">{wf.workflowName}</div>
                              <div className="text-xs text-slate-400 line-clamp-1">{wf.description || 'Enterprise execution pipeline'}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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

                {/* Tabs */}
                <div className="flex space-x-4 border-b border-slate-800">
                  <button 
                    onClick={() => setActiveTab('findings')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'findings' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                  >
                    Live Posture & Findings
                  </button>
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'timeline' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                  >
                    <Clock className="w-4 h-4 mr-2" /> Asset Timeline
                  </button>
                  <button 
                    onClick={() => setActiveTab('jobs')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'jobs' ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                  >
                    <GitMerge className="w-4 h-4 mr-2" /> Workflow Pipeline
                  </button>
                  <button 
                    onClick={() => setActiveTab('intelligence')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'intelligence' ? 'border-red-500 text-red-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                  >
                    <BrainCircuit className="w-4 h-4 mr-2" /> Threat Intelligence
                  </button>
                  <button 
                    onClick={() => setActiveTab('migration')}
                    className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center ${activeTab === 'migration' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                  >
                    <Route className="w-4 h-4 mr-2" /> Migration Roadmap
                  </button>
                </div>

                {/* Workflow Tab */}
                {activeTab === 'jobs' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-semibold text-white mb-6">Orchestration Pipeline</h3>
                    
                    {!activeWorkflowRun && !activeJob ? (
                      <div className="text-center text-slate-500 py-8">No active workflow or job running for this asset.</div>
                    ) : (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <span className="bg-purple-500/20 text-purple-400 p-2 rounded-lg"><GitMerge className="w-5 h-5"/></span>
                            <div>
                              <h4 className="text-white font-medium capitalize">
                                {activeWorkflowRun ? activeWorkflowRun.workflow.workflowName : activeJob?.jobType.replace('-', ' ')}
                              </h4>
                              <p className="text-xs text-slate-500 font-mono">Run ID: {activeWorkflowRun?.id.split('-')[0] || activeJob?.id.split('-')[0]}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            (activeWorkflowRun?.status || activeJob?.jobStatus) === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            (activeWorkflowRun?.status || activeJob?.jobStatus) === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse'
                          }`}>
                            {activeWorkflowRun?.status || activeJob?.jobStatus}
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Pipeline Progress</span>
                            <span className="text-white font-medium">{activeWorkflowRun?.progress || activeJob?.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                            <div className="bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 h-full transition-all duration-500 relative" style={{ width: `${activeWorkflowRun?.progress || activeJob?.progress || 0}%` }}>
                              <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-pulse"></div>
                            </div>
                          </div>
                          
                          {/* Step List rendering */}
                          {activeWorkflowRun && (
                            <div className="mt-6 space-y-3">
                              <h5 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">Execution Steps</h5>
                              {activeWorkflowRun.workflow.steps.map((step) => {
                                const execution = activeWorkflowRun.stepExecutions?.find(e => e.workflowStepId === step.id);
                                return (
                                  <div key={step.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-900 border border-slate-800">
                                    <div className="flex items-center gap-3">
                                      {execution?.status === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                                       execution?.status === 'running' ? <RefreshCw className="w-4 h-4 text-orange-400 animate-spin" /> :
                                       execution?.status === 'failed' ? <XCircle className="w-4 h-4 text-red-500" /> :
                                       <CircleDashed className="w-4 h-4 text-slate-600" />}
                                      <span className={execution?.status === 'completed' ? 'text-slate-300' : execution?.status === 'running' ? 'text-white font-medium' : 'text-slate-500'}>
                                        {step.stepOrder}. {step.displayName}
                                      </span>
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono uppercase bg-slate-950 px-2 py-1 rounded">
                                      {execution?.status || 'pending'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {!activeWorkflowRun && activeJob && (
                             <p className="text-xs text-slate-500 mt-2 text-right">{activeJob.currentStage || 'Waiting in queue...'}</p>
                          )}
                        </div>
                        
                        {(activeWorkflowRun?.stepExecutions?.find(e => e.status === 'failed')?.errorMessage || activeJob?.errorMessage) && (
                          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <div>
                              <strong>Execution Error:</strong><br />
                              {activeWorkflowRun?.stepExecutions?.find(e => e.status === 'failed')?.errorMessage || activeJob?.errorMessage}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-lg font-semibold text-white mb-6">Historical Events</h3>
                    {timelineEvents.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">No historical events recorded yet. Run a scan to generate the first event.</div>
                    ) : (
                      <div className="relative border-l border-slate-800 ml-3 space-y-8">
                        {timelineEvents.map((event) => (
                          <div key={event.id} className="relative pl-8">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-slate-900 ${
                              event.severity === 'critical' ? 'bg-red-500' :
                              event.severity === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="text-white font-medium text-sm">{event.title}</h4>
                              <span className="text-xs text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded">
                                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(event.createdAt))}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-2">{event.description}</p>
                            <div className="flex items-center space-x-3 text-xs">
                              <span className="text-slate-500 uppercase tracking-wider">{event.sourceModule}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Threat Intelligence Tab */}
                {activeTab === 'intelligence' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <BrainCircuit className="w-5 h-5 mr-2 text-red-500" /> Enterprise Threat Correlation
                      </h3>
                    </div>

                    {correlations.length === 0 ? (
                      <div className="text-center text-slate-500 py-12 bg-slate-950/50 rounded-lg border border-slate-800/50">
                        <BrainCircuit className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p>No threat intelligence correlated for this asset yet.</p>
                        <p className="text-sm mt-1">Run an orchestration pipeline to generate intelligence.</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {correlations.map(correlation => (
                          <div key={correlation.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                              <div>
                                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Correlation Run</span>
                                <h4 className="text-white text-sm font-medium mt-0.5">{new Date(correlation.correlatedAt).toLocaleString()}</h4>
                              </div>
                              <div className="flex gap-3">
                                <div className="text-right">
                                  <span className="text-xs text-slate-500 uppercase">Severity</span>
                                  <div className={`text-sm font-bold capitalize ${correlation.overallSeverity === 'critical' ? 'text-red-500' : correlation.overallSeverity === 'high' ? 'text-orange-500' : 'text-yellow-500'}`}>
                                    {correlation.overallSeverity}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-slate-500 uppercase">Priority</span>
                                  <div className="text-sm font-bold text-white">{correlation.overallPriority}/100</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-5">
                              <h5 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2">Identified Threats</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {correlation.matches.map(match => (
                                  <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-red-400 font-mono text-sm">{match.algorithmFamily}</span>
                                      <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">{match.severity}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2">{match.impact || (match.rule?.description)}</p>
                                    <div className="text-xs text-slate-500 flex justify-between border-t border-slate-800 pt-2 mt-2">
                                      <span>Source: {match.threatSource}</span>
                                      <span>Confidence: {match.confidence}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <h5 className="text-sm font-semibold text-slate-300 mb-3 border-b border-slate-800 pb-2">Recommended Actions</h5>
                              <div className="space-y-3">
                                {correlation.recommendations.map(rec => (
                                  <div key={rec.id} className="flex gap-4 items-start bg-blue-900/10 border border-blue-900/30 rounded-lg p-4">
                                    <div className="bg-blue-500/20 p-2 rounded shrink-0">
                                      <Shield className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                      <h6 className="text-white text-sm font-semibold">{rec.title}</h6>
                                      <p className="text-slate-400 text-xs mt-1">{rec.description}</p>
                                      <div className="flex gap-4 mt-3">
                                        <span className="text-xs text-slate-500">Effort: <strong className="text-slate-300">{rec.estimatedEffort}</strong></span>
                                        <span className="text-xs text-slate-500">Risk Reduction: <strong className="text-emerald-400">+{rec.estimatedRiskReduction} pts</strong></span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Migration Roadmap Tab */}
                {activeTab === 'migration' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Route className="w-5 h-5 mr-2 text-indigo-500" /> Enterprise Migration Roadmap
                      </h3>
                      {migrationPlan && (
                        <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-500/20">
                          {migrationPlan.status}
                        </div>
                      )}
                    </div>

                    {!migrationPlan ? (
                      <div className="text-center text-slate-500 py-12 bg-slate-950/50 rounded-lg border border-slate-800/50">
                        <Route className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p>No migration plan generated for this asset yet.</p>
                        <p className="text-sm mt-1">Run an orchestration pipeline to assess migration readiness.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Executive KPIs */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <span className="text-xs text-slate-500 uppercase">Est. Engineering Effort</span>
                            <div className="text-xl font-bold text-white mt-1">{migrationPlan.estimatedEngineeringEffort} <span className="text-sm font-normal text-slate-400">hours</span></div>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <span className="text-xs text-slate-500 uppercase">Est. Duration</span>
                            <div className="text-xl font-bold text-white mt-1">{migrationPlan.estimatedDurationDays} <span className="text-sm font-normal text-slate-400">days</span></div>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <span className="text-xs text-slate-500 uppercase">Risk Reduction Forecast</span>
                            <div className="text-xl font-bold text-emerald-400 mt-1">+{migrationPlan.estimatedRiskReduction} <span className="text-sm font-normal text-emerald-500/50">pts</span></div>
                          </div>
                          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <span className="text-xs text-slate-500 uppercase">Technical Priority</span>
                            <div className="text-xl font-bold text-orange-400 mt-1">{migrationPlan.technicalPriority}/100</div>
                          </div>
                        </div>

                        {/* Migration Phases */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 border-b border-slate-800 pb-2">Execution Phases</h4>
                          
                          {migrationPlan.phases.map(phase => (
                            <div key={phase.id} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                              <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="bg-indigo-500/20 text-indigo-400 w-6 h-6 rounded flex items-center justify-center font-bold text-xs">{phase.phaseOrder}</div>
                                  <h5 className="font-medium text-white">{phase.title}</h5>
                                </div>
                                <span className="text-xs text-slate-500 uppercase tracking-wider">{phase.status}</span>
                              </div>
                              
                              {phase.tasks.length === 0 ? (
                                <div className="p-4 text-sm text-slate-500 text-center">No tasks currently mapped to this phase.</div>
                              ) : (
                                <div className="divide-y divide-slate-800">
                                  {phase.tasks.map(task => (
                                    <div key={task.id} className="p-4 hover:bg-slate-900/30 transition-colors">
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <Settings2 className="w-4 h-4 text-slate-500" />
                                          <span className="font-medium text-slate-200 text-sm">{task.title}</span>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${
                                          task.complexity === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                          task.complexity === 'Medium' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>{task.complexity} Complexity</span>
                                      </div>
                                      
                                      <p className="text-xs text-slate-400 pl-6 mb-3">{task.description}</p>
                                      
                                      <div className="pl-6 flex gap-4 text-xs">
                                        <div className="bg-slate-900 border border-slate-800 rounded px-3 py-1 flex gap-2 items-center">
                                          <span className="text-slate-500">Current:</span>
                                          <span className="text-red-400 font-mono">{task.currentTechnology}</span>
                                        </div>
                                        <div className="flex items-center text-slate-500">
                                          <ArrowRight className="w-3 h-3" />
                                        </div>
                                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded px-3 py-1 flex gap-2 items-center">
                                          <span className="text-slate-500">Target:</span>
                                          <span className="text-emerald-400 font-mono">{task.recommendedTechnology}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Scan Results Overlay */}
                {activeTab === 'findings' && scanResult && (
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
                {activeTab === 'findings' && activeFinding && (
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
