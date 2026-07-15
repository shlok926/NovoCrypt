import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Microchip, Beaker, Hexagon, TrendingUp, Trophy } from 'lucide-react';

const initialCompanies = [
  { name: 'IBM', country: '🇺🇸', type: 'Superconducting', physical: 1121, logical: 0, target: '2029 (200 LQ)', color: 'from-blue-600 to-cyan-500' },
  { name: 'Google', country: '🇺🇸', type: 'Superconducting', physical: 105, logical: 1, target: '2030 (1M PQ)', color: 'from-red-500 to-orange-500' },
  { name: 'Quantinuum', country: '🇺🇸/🇬🇧', type: 'Trapped-ion', physical: 98, logical: 48, target: '2030 (100s LQ)', color: 'from-indigo-600 to-purple-500' },
  { name: 'QuEra', country: '🇺🇸', type: 'Neutral atom', physical: 448, logical: 96, target: 'Scaling', color: 'from-emerald-500 to-teal-500' },
  { name: 'Origin Quantum', country: '🇨🇳', type: 'Superconducting', physical: 180, logical: 0, target: 'Scaling', color: 'from-rose-600 to-pink-500' },
  { name: 'QpiAI', country: '🇮🇳', type: 'Superconducting', physical: 64, logical: 0, target: '2030 (100 LQ)', color: 'from-amber-500 to-yellow-400' },
];

export default function CompanyRaceTrack() {
  const [companies, setCompanies] = useState(initialCompanies);
  const maxLogical = 120; // Normalizing for UI

  // Simulate live research progress (fluctuating data)
  useEffect(() => {
    const interval = setInterval(() => {
      setCompanies((prev) => 
        prev.map(c => {
          // Only occasionally simulate a breakthrough
          if (Math.random() > 0.8) {
            return {
              ...c,
              physical: c.physical + Math.floor(Math.random() * 3),
              logical: c.logical > 0 ? c.logical + (Math.random() > 0.9 ? 1 : 0) : 0
            };
          }
          return c;
        }).sort((a, b) => {
          // Sort logic: Logical qubits take precedence over physical
          const scoreA = (a.logical * 100) + a.physical;
          const scoreB = (b.logical * 100) + b.physical;
          return scoreB - scoreA;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 relative z-10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium text-xs mb-4">
            <ActivityIcon /> Live Global Tracker
          </div>
          <h3 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-cyan-400" /> The Hardware Race
          </h3>
          <p className="text-slate-400 text-sm max-w-2xl">
            Live telemetry of top quantum vendors approaching Fault-Tolerant Quantum Computing (FTQC). 
            Reaching ~4000 <strong>Logical Qubits (LQ)</strong> initiates Q-Day.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-xl flex flex-col items-center justify-center">
            <span className="text-purple-400 font-bold text-lg">LQ</span>
            <span className="text-xs text-purple-300/70 uppercase">Logical</span>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl flex flex-col items-center justify-center">
            <span className="text-slate-300 font-bold text-lg">PQ</span>
            <span className="text-xs text-slate-500 uppercase">Physical</span>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <AnimatePresence>
          {companies.map((company, idx) => {
            const isLeading = idx === 0;
            const progressValue = Math.min((company.logical > 0 ? company.logical : company.physical / 20) / maxLogical * 100, 100);
            
            return (
              <motion.div 
                key={company.name} 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className={`relative bg-slate-950/50 border ${isLeading ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-slate-800'} rounded-2xl p-5 hover:bg-slate-900 transition-colors group`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  
                  {/* Left info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                      {isLeading ? <Trophy className="w-6 h-6 text-amber-500" /> : <Hexagon className="w-6 h-6 text-slate-600" />}
                    </div>
                    <div>
                      <h4 className="text-lg text-white font-bold flex items-center gap-2">
                        {company.name} <span className="text-sm opacity-80">{company.country}</span>
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Beaker className="w-3 h-3" /> {company.type} • Target: {company.target}
                      </p>
                    </div>
                  </div>

                  {/* Right metrics */}
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Physical</p>
                      <motion.p 
                        key={company.physical}
                        initial={{ color: '#fff', scale: 1.1 }}
                        animate={{ color: '#94a3b8', scale: 1 }}
                        className="text-xl font-mono font-bold text-slate-400"
                      >
                        {company.physical}
                      </motion.p>
                    </div>
                    <div className="w-px h-10 bg-slate-800" />
                    <div className="text-right w-24">
                      <p className="text-xs text-purple-400/80 uppercase tracking-widest mb-1">Logical</p>
                      <motion.p 
                        key={company.logical}
                        initial={{ color: '#a855f7', scale: 1.2 }}
                        animate={{ color: '#c084fc', scale: 1 }}
                        className="text-2xl font-mono font-black text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      >
                        {company.logical}
                      </motion.p>
                    </div>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden relative shadow-inner border border-slate-800/50">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressValue}%` }}
                    transition={{ duration: 1.5, type: 'spring' }}
                    className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${company.logical > 0 ? company.color : 'from-slate-600 to-slate-500 opacity-50'}`}
                  >
                    {company.logical > 0 && (
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay" />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}

function ActivityIcon() {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
    </div>
  );
}
