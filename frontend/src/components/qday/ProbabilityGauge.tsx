import { useEffect, useState } from 'react';
import { getQDayProbability } from '../../services/qdayService';
import { QDayProbability } from '../../types/qday.types';
import { motion } from 'framer-motion';
import { Activity, Clock, Cpu, TrendingUp, TrendingDown, Target } from 'lucide-react';

export default function ProbabilityGauge() {
  const [baseProbability, setBaseProbability] = useState<QDayProbability | null>(null);
  const [liveProbability, setLiveProbability] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    getQDayProbability()
      .then((data) => {
        setBaseProbability(data);
        setLiveProbability(data.probability);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Simulate real-time fluctuation (like a live sensor)
  useEffect(() => {
    if (!baseProbability) return;
    
    const interval = setInterval(() => {
      setLiveProbability(prev => {
        // Fluctuate between -1.5% and +1.5% of base
        const maxOffset = 1.5;
        const currentOffset = prev - baseProbability.probability;
        
        let change = (Math.random() - 0.5) * 0.8;
        // Keep it within bounds
        if (currentOffset > maxOffset) change = -Math.abs(change);
        if (currentOffset < -maxOffset) change = Math.abs(change);
        
        return Number((prev + change).toFixed(1));
      });
      setPulse(p => !p);
    }, 2000);

    return () => clearInterval(interval);
  }, [baseProbability]);

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 animate-pulse shadow-2xl h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-slate-400 font-medium">Initializing Real-Time Q-Day Sensors...</p>
        </div>
      </div>
    );
  }

  if (!baseProbability) {
    return (
      <div className="bg-red-950/20 border border-red-500/20 rounded-3xl p-8 text-red-400 flex items-center gap-3">
        <Activity className="w-6 h-6" />
        Failed to establish link with Q-Day prediction servers.
      </div>
    );
  }

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  // Use live probability for the gauge offset
  const offset = circumference - (liveProbability / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 70) return { bg: 'from-red-600/20 to-orange-600/20', text: 'text-red-500', stroke: '#ef4444', shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.3)]' };
    if (score >= 50) return { bg: 'from-orange-600/20 to-yellow-600/20', text: 'text-orange-500', stroke: '#f97316', shadow: 'shadow-[0_0_40px_rgba(249,115,22,0.3)]' };
    if (score >= 30) return { bg: 'from-yellow-600/20 to-blue-600/20', text: 'text-yellow-500', stroke: '#eab308', shadow: 'shadow-[0_0_40px_rgba(234,179,8,0.3)]' };
    return { bg: 'from-blue-600/20 to-cyan-600/20', text: 'text-cyan-400', stroke: '#06b6d4', shadow: 'shadow-[0_0_40px_rgba(6,182,212,0.3)]' };
  };

  const color = getColor(liveProbability);

  return (
    <div className={`bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-10 ${color.shadow} transition-all duration-700 relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${color.bg} rounded-full blur-[100px] pointer-events-none opacity-50`} />

      <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
        
        {/* Gauge Container */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-[300px] h-[300px] flex items-center justify-center">
            {/* Outer animated ring */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border border-dashed border-slate-700 rounded-full opacity-50"
            />
            
            <svg width="280" height="280" className="transform -rotate-90 drop-shadow-xl z-10">
              {/* Background circle */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="16"
              />
              {/* Progress circle */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="none"
                stroke={color.stroke}
                strokeWidth="16"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-in-out"
                style={{ filter: `drop-shadow(0 0 8px ${color.stroke})` }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
              <motion.div 
                key={liveProbability}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-6xl font-black tracking-tighter ${color.text} drop-shadow-lg flex items-start`}
              >
                {liveProbability.toFixed(1)}
                <span className="text-3xl mt-2">%</span>
              </motion.div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mt-2 bg-slate-950/50 px-3 py-1 rounded-full border border-slate-800">
                <span className={`w-2 h-2 rounded-full ${pulse ? color.bg : 'bg-slate-700'} transition-colors duration-500`}></span>
                Live Probability
              </div>
            </div>
          </div>
        </div>

        {/* Info & Metrics Panel */}
        <div className="flex-1 w-full space-y-8">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className={`w-6 h-6 ${color.text}`} /> Threat Level
              </h3>
              <p className="text-slate-400 mt-1">Real-time breakdown of timeline advancement</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800">
              {baseProbability.trend === 'increasing' ? <TrendingUp className="w-5 h-5 text-red-400" /> : <TrendingDown className="w-5 h-5 text-emerald-400" />}
              <span className={`font-bold capitalize ${color.text}`}>
                {baseProbability.trend}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(baseProbability.factors).map(([factor, score]) => (
              <div key={factor} className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    {factor.includes('qubit') ? <Cpu className="w-4 h-4 text-cyan-400" /> : <Activity className="w-4 h-4 text-purple-400" />}
                    {factor.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {Math.round(score as number)}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${color.bg.replace('/20', '').replace('/20', '')}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Last Sync: {new Date(baseProbability.lastUpdated).toLocaleTimeString()}
            </span>
            <span className="text-cyan-500/50">Data powered by Novocrypt Intelligence</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
