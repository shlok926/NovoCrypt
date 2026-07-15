import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export function PqcLabHeader() {
  return (
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
  );
}
