import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Cpu, Key, Lock, Activity, ArrowRight, Zap, Target } from 'lucide-react';
import { encryptMessage } from '../services/playgroundService';
import { EncryptionResult } from '../types/qday.types';

export default function Playground() {
  const [message, setMessage] = useState('TOP SECRET: Novocrypt Launch Codes 2026');
  const [activeTab, setActiveTab] = useState<'kyber' | 'rsa'>('kyber');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EncryptionResult | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await encryptMessage(message, activeTab === 'kyber' ? 'Kyber' : 'RSA', activeTab === 'kyber' ? 768 : 2048);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[0%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[0%] left-[10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium text-xs mb-4">
            <Activity className="w-4 h-4" /> Live Simulation Environment
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight flex items-center gap-4">
            PQC Testing Lab
          </h1>
          <p className="text-slate-400 mt-4 max-w-2xl text-lg">
            Benchmark Post-Quantum Cryptography (ML-KEM / Kyber) against Classical (RSA). Observe the architectural differences in key generation, encryption speed, and quantum resilience.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Controls Panel */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-5 space-y-6">
            
            {/* Algorithm Selector */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" /> Select Target Architecture
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { setActiveTab('kyber'); setResult(null); }}
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
                  onClick={() => { setActiveTab('rsa'); setResult(null); }}
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

          {/* Results Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-7">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl h-full min-h-[600px] flex flex-col">
              
              {!result && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <Cpu className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg">System standing by.</p>
                  <p className="text-sm">Select architecture and initialize protocol to begin.</p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className={`absolute inset-0 rounded-full border-b-2 border-l-2 ${activeTab === 'kyber' ? 'border-cyan-500' : 'border-red-500'}`} />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} className={`absolute inset-4 rounded-full border-t-2 border-r-2 ${activeTab === 'kyber' ? 'border-purple-500' : 'border-orange-500'}`} />
                    <Key className={`w-8 h-8 ${activeTab === 'kyber' ? 'text-cyan-400' : 'text-red-400'}`} />
                  </div>
                  <p className="text-slate-400 animate-pulse font-mono text-sm uppercase tracking-widest">Generating Lattice Matrices...</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {result && !loading && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                    
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                          <Zap className={`w-6 h-6 ${activeTab === 'kyber' ? 'text-cyan-400' : 'text-red-400'}`} /> Output Log
                        </h3>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-widest">Execution Time</p>
                          <p className="text-xl font-mono text-emerald-400">{result.encryptionTimeMs}ms</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-widest">Key Size</p>
                          <p className="text-xl font-mono text-white">{result.keySize} bits</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Key className="w-3 h-3" /> Public Key Generated
                        </label>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-500 break-all h-32 overflow-y-auto custom-scrollbar">
                          {result.key.publicKey}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Lock className="w-3 h-3" /> Encrypted Ciphertext
                        </label>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 break-all h-32 overflow-y-auto custom-scrollbar relative">
                          <div className={`absolute inset-0 opacity-10 pointer-events-none ${activeTab === 'kyber' ? 'bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]' : ''}`} />
                          {result.ciphertext}
                        </div>
                      </div>
                    </div>

                    <div className={`mt-6 p-6 rounded-2xl border ${activeTab === 'kyber' ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <h4 className={`font-bold flex items-center gap-2 mb-2 ${activeTab === 'kyber' ? 'text-cyan-400' : 'text-red-400'}`}>
                        {activeTab === 'kyber' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />} 
                        {activeTab === 'kyber' ? 'Quantum Resistance Verified' : 'Vulnerable to Shor\'s Algorithm'}
                      </h4>
                      <p className="text-sm text-slate-300">
                        {activeTab === 'kyber' 
                          ? 'This ciphertext relies on the Module Learning with Errors (MLWE) problem. A quantum computer running Shor\'s algorithm cannot break lattice-based structures, meaning this data remains secure.' 
                          : 'This ciphertext relies on prime factorization. A cryptographically relevant quantum computer (CRQC) can easily derive the private key and decrypt this payload using Shor\'s algorithm.'}
                      </p>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
