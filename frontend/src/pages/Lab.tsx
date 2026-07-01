import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../components/ui';
import { useRSA } from '../hooks/useRSA';
import { formatNumber, formatTime } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, Cpu, Zap, ShieldAlert, Microscope, 
  Terminal, Activity, Clock, Hash, CheckCircle 
} from 'lucide-react';

export const Lab: React.FC = () => {
  const [p, setP] = useState(3);
  const [q, setQ] = useState(5);
  const [e, setE] = useState(5);
  const [keySize, setKeySize] = useState<8 | 16>(8);

  const { generateKeys, runClassicalAttack, runQuantumAttack, isLoading, error } = useRSA();

  const [keyPair, setKeyPair] = useState<any>(null);
  const [classicalResult, setClassicalResult] = useState<any>(null);
  const [quantumResult, setQuantumResult] = useState<any>(null);

  const handleGenerateKeys = () => {
    const result = generateKeys(p, q, e);
    if (result) {
      setKeyPair(result);
      setClassicalResult(null);
      setQuantumResult(null);
    }
  };

  const handleRunBothAttacks = () => {
    if (!keyPair) return;

    const n = keyPair.publicKey.n;
    const classical = runClassicalAttack(n);
    const quantum = runQuantumAttack(n);

    if (classical) setClassicalResult(classical);
    if (quantum) setQuantumResult(quantum);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Expanded Container Width */}
      <motion.div 
        className="w-full max-w-[95%] xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-sm mb-4">
              <Microscope className="w-4 h-4" />
              Interactive Simulation
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight flex items-center gap-4">
              <Key className="w-10 h-10 text-cyan-400" /> 
              RSA Algorithm Lab
            </h1>
            <p className="text-slate-400 mt-4 max-w-2xl">
              Configure legacy RSA key parameters and simulate side-by-side attacks using classical brute-force vs. quantum Shor's Algorithm.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-5 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 backdrop-blur-sm">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Classical Compute</p>
                <p className="text-sm font-bold text-white">Active</p>
              </div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 backdrop-blur-sm">
              <Zap className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-slate-500 font-medium">Quantum Compute</p>
                <p className="text-sm font-bold text-white">Ready</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Key Generation Module */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl h-full shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50 group-hover:opacity-100 transition-opacity" />
              
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Terminal className="w-5 h-5 text-blue-400" /> Key Generator
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/50">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-4">
                    <Hash className="w-4 h-4 text-slate-500" /> Security Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={keySize === 8 ? 'primary' : 'secondary'}
                      onClick={() => setKeySize(8)}
                      className={`w-full py-3 ${keySize === 8 ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      8-bit (Demo)
                    </Button>
                    <Button
                      variant={keySize === 16 ? 'primary' : 'secondary'}
                      onClick={() => setKeySize(16)}
                      className={`w-full py-3 ${keySize === 16 ? 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      16-bit
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input label="Prime (P)" type="number" value={p} onChange={(e) => setP(Number(e.target.value))} />
                  <Input label="Prime (Q)" type="number" value={q} onChange={(e) => setQ(Number(e.target.value))} />
                  <Input label="Public Exponent (E)" type="number" value={e} onChange={(e) => setE(Number(e.target.value))} />
                </div>

                <Button
                  onClick={handleGenerateKeys}
                  isLoading={isLoading}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] transition-all"
                >
                  Generate RSA Keys
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Visualization & Results Area */}
          <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Current Key State */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-cyan-400" /> Active Cryptographic State
              </h2>
              
              {!keyPair ? (
                <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
                  <Key className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 font-medium">No keys generated yet.</p>
                  <p className="text-sm text-slate-600 mt-1">Configure parameters and generate keys to begin.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Public Modulus (N)</p>
                    <p className="text-2xl font-mono text-white">{formatNumber(keyPair.publicKey.n)}</p>
                  </div>
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Euler's Totient φ(n)</p>
                    <p className="text-2xl font-mono text-white">{formatNumber(keyPair.phi)}</p>
                  </div>
                  <div className="bg-cyan-500/10 p-5 rounded-2xl border border-cyan-500/20">
                    <p className="text-xs font-semibold text-cyan-500 uppercase tracking-wider mb-1">Public Key (E, N)</p>
                    <p className="text-lg font-mono text-cyan-100 break-all">({keyPair.publicKey.e}, {formatNumber(keyPair.publicKey.n)})</p>
                  </div>
                  <div className="bg-purple-500/10 p-5 rounded-2xl border border-purple-500/20">
                    <p className="text-xs font-semibold text-purple-500 uppercase tracking-wider mb-1">Private Key (D, N) [Target]</p>
                    <p className="text-lg font-mono text-purple-100 break-all">({keyPair.privateKey.d}, {formatNumber(keyPair.privateKey.n)})</p>
                  </div>
                </div>
              )}
            </div>

            {/* Attack Simulator */}
            <AnimatePresence mode="wait">
              {keyPair && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl flex-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Activity className="w-6 h-6 text-red-400" /> Attack Simulator
                    </h2>
                    <Button
                      onClick={handleRunBothAttacks}
                      isLoading={isLoading}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl border border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                      Launch Dual Attack
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    {/* Classical Result */}
                    <div className={`p-6 rounded-2xl border transition-all duration-500 ${classicalResult ? 'bg-slate-950/80 border-slate-700 shadow-inner' : 'bg-slate-950/30 border-slate-800/50 flex items-center justify-center'}`}>
                      {!classicalResult ? (
                        <p className="text-slate-600 font-medium">Awaiting Execution...</p>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Cpu className="w-5 h-5 text-slate-400" /> Classical Brute-Force
                            </h3>
                            <Badge variant="high" className="bg-slate-800 text-slate-300 border-slate-700">O(exp)</Badge>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time Elapsed</p>
                              <p className="text-2xl font-mono text-white">{formatTime(classicalResult.time)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Discovered Factors (p, q)</p>
                              <div className="flex gap-2 mt-2">
                                {classicalResult.factors.map((f: number, i: number) => (
                                  <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md font-mono text-sm">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quantum Result */}
                    <div className={`p-6 rounded-2xl border transition-all duration-500 relative overflow-hidden ${quantumResult ? 'bg-purple-950/20 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]' : 'bg-slate-950/30 border-slate-800/50 flex items-center justify-center'}`}>
                      {quantumResult && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />}
                      
                      {!quantumResult ? (
                        <p className="text-slate-600 font-medium">Awaiting Execution...</p>
                      ) : (
                        <div className="space-y-6 relative z-10">
                          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <Zap className="w-5 h-5 text-purple-400" /> Shor's Algorithm
                            </h3>
                            <Badge variant="critical" className="bg-purple-500/20 text-purple-300 border-purple-500/30">O(poly)</Badge>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Time</p>
                                <p className="text-2xl font-mono text-purple-100">{formatTime(quantumResult.time)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Q-Steps</p>
                                <p className="text-2xl font-mono text-purple-100">{quantumResult.steps}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Found Period (r)</p>
                              <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-md font-mono text-sm">
                                {quantumResult.period}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advantage Banner */}
                  {classicalResult && quantumResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-6 p-4 md:p-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-2xl flex items-center gap-4 shadow-lg relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
                      
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Quantum Advantage Verified</h4>
                        <p className="text-sm text-blue-200">
                          {quantumResult.time > 0 
                            ? `Shor's algorithm completed the factorization ${(classicalResult.time / quantumResult.time).toFixed(1)}x faster than classical brute-force for a ${keySize}-bit key.`
                            : `Shor's algorithm completed with near-instantaneous quantum advantage compared to classical methods.`}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
