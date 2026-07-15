import { Target, ShieldCheck, ShieldAlert, Lock, ArrowRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  activeTab: 'kyber' | 'rsa';
  setActiveTab: (tab: 'kyber' | 'rsa') => void;
  message: string;
  setMessage: (msg: string) => void;
  handleSimulate: () => void;
  loading: boolean;
}

export function PqcLabControls({ activeTab, setActiveTab, message, setMessage, handleSimulate, loading }: Props) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5 space-y-6">
      
      {/* Algorithm Selector */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" /> Select Target Architecture
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('kyber')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'kyber' 
                ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className={`w-8 h-8 mb-3 ${activeTab === 'kyber' ? 'text-cyan-400' : 'text-slate-600'}`} />
            <h4 className={`font-bold ${activeTab === 'kyber' ? 'text-cyan-400' : 'text-slate-300'}`}>ML-KEM (Kyber)</h4>
            <p className="text-xs text-slate-500 mt-1">Lattice-based • Safe</p>
          </button>

          <button
            onClick={() => setActiveTab('rsa')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'rsa' 
                ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <ShieldAlert className={`w-8 h-8 mb-3 ${activeTab === 'rsa' ? 'text-red-400' : 'text-slate-600'}`} />
            <h4 className={`font-bold ${activeTab === 'rsa' ? 'text-red-400' : 'text-slate-300'}`}>RSA-2048</h4>
            <p className="text-xs text-slate-500 mt-1">Factorization • Vulnerable</p>
          </button>
        </div>
      </div>

      {/* Input Data */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-400" /> Data Payload
        </h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
          rows={4}
        />
        
        <button
          onClick={handleSimulate}
          disabled={loading || !message.trim()}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <><Activity className="w-5 h-5 animate-spin" /> Compiling Cryptographic Sequence...</>
          ) : (
            <>Initialize Encryption Protocol <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </div>
      
    </motion.div>
  );
}
