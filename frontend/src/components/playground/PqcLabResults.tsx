import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Cpu, Key, Lock, Zap } from 'lucide-react';
import { EncryptionResult } from '../../types/qday.types';

interface Props {
  activeTab: 'kyber' | 'rsa';
  loading: boolean;
  result: EncryptionResult | null;
}

export function PqcLabResults({ activeTab, loading, result }: Props) {
  return (
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
            <p className="text-slate-400 animate-pulse font-mono text-sm uppercase tracking-widest">Generating Matrices...</p>
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
  );
}
