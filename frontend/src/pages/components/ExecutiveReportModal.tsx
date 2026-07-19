import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckSquare, Square, Download, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODULES = [
  { id: 'threat_intelligence', label: 'Threat Intelligence', default: true },
  { id: 'scanner', label: 'Scanner Results', default: true },
  { id: 'pqc_readiness', label: 'PQC Readiness', default: true },
  { id: 'compliance', label: 'Compliance (Coming Soon)', default: false, disabled: true },
  { id: 'risk_analytics', label: 'Risk Analytics (Coming Soon)', default: false, disabled: true }
];

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({ isOpen, onClose }) => {
  const [selectedModules, setSelectedModules] = useState<string[]>(
    MODULES.filter(m => m.default).map(m => m.id)
  );
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const toggleModule = (id: string, disabled?: boolean) => {
    if (disabled) return;
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedModules.length === 0) {
      setError('Please select at least one module.');
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      setStage('Queuing report generation...');
      setError(null);
      
      const token = localStorage.getItem('token');
      const queueResponse = await fetch('http://localhost:5000/api/reports/export-executive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ modules: selectedModules, dateRange })
      });

      if (!queueResponse.ok) {
        const errData = await queueResponse.json();
        throw new Error(errData.message || 'Failed to queue report');
      }

      const queueData = await queueResponse.json();
      const jobId = queueData.data.jobId;

      // Poll job status
      let jobCompleted = false;
      while (!jobCompleted) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const statusResponse = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!statusResponse.ok) throw new Error('Failed to check report status');
        
        const statusData = await statusResponse.json();
        const job = statusData.data;

        setProgress(job.progress || 0);
        setStage(job.currentStage || 'Processing...');

        if (job.jobStatus === 'failed') {
          throw new Error(job.errorMessage || 'Report generation failed');
        }

        if (job.jobStatus === 'completed') {
          jobCompleted = true;
          setStage('Downloading PDF...');
          
          // Download the file
          const downloadResponse = await fetch(`http://localhost:5000/api/reports/download/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!downloadResponse.ok) throw new Error('Failed to download report');
          
          const blob = await downloadResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          // Look for filename in content-disposition header if possible, otherwise fallback
          const disposition = downloadResponse.headers.get('Content-Disposition');
          let filename = `Executive-Security-Report-${new Date().toISOString().split('T')[0]}.pdf`;
          if (disposition && disposition.indexOf('filename=') !== -1) {
            const matches = /filename="([^"]+)"/.exec(disposition);
            if (matches != null && matches[1]) filename = matches[1];
          }
          a.download = filename;
          
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 w-full max-w-lg z-10"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Executive Security Report</h2>
              <p className="text-slate-400 text-sm">Configure and download your aggregated report</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm text-center font-medium">
              Report generated and downloaded successfully!
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-3 text-sm">Time Period</h3>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isGenerating}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div>
              <h3 className="text-white font-medium mb-3 text-sm">Include Modules</h3>
              <div className="space-y-2">
                {MODULES.map(module => {
                  const isSelected = selectedModules.includes(module.id);
                  return (
                    <div 
                      key={module.id}
                      onClick={() => toggleModule(module.id, module.disabled)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        module.disabled 
                          ? 'opacity-50 cursor-not-allowed border-slate-800 bg-slate-950/50' 
                          : 'cursor-pointer hover:bg-slate-800 border-slate-700 bg-slate-900'
                      } ${isSelected && !module.disabled ? 'border-blue-500/50 bg-blue-500/5' : ''}`}
                    >
                      {isSelected ? (
                        <CheckSquare className={`w-5 h-5 ${module.disabled ? 'text-slate-500' : 'text-blue-400'}`} />
                      ) : (
                        <Square className="w-5 h-5 text-slate-500" />
                      )}
                      <span className={`text-sm ${module.disabled ? 'text-slate-500' : 'text-slate-300'}`}>
                        {module.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {isGenerating && (
              <div className="bg-slate-950 rounded-lg p-4 border border-blue-500/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-400">{stage}</span>
                  <span className="text-sm text-slate-400">{progress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className="bg-blue-500 h-2 rounded-full" 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || selectedModules.length === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2 inline" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
