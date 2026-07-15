import React, { useState } from 'react';
import { Card, Tabs, Badge } from '../components/ui';
import { ALGORITHMS_DATA, NIST_STANDARDS } from '../constants/algorithms';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Database, ShieldCheck, Activity, Search, BookOpen, AlertTriangle } from 'lucide-react';

export const Algorithms: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlgorithms = ALGORITHMS_DATA.filter((algo) =>
    algo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    algo.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const algorithmTabs = [
    {
      label: 'All Algorithms',
      value: 'all',
      content: (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search algorithms by name or category..."
              className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">Algorithm</th>
                    <th className="px-6 py-4 text-left font-semibold">Category</th>
                    <th className="px-6 py-4 text-left font-semibold">Key Size</th>
                    <th className="px-6 py-4 text-left font-semibold">Quantum Safe</th>
                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlgorithms.map((algo, idx) => (
                    <motion.tr 
                      variants={itemVariants}
                      key={idx} 
                      className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-400" /> {algo.name}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{algo.category}</td>
                      <td className="px-6 py-4 font-mono text-slate-400">{algo.keySize} bits</td>
                      <td className="px-6 py-4">
                        <Badge variant={algo.quantumSafe ? 'low' : 'critical'} className="shadow-lg">
                          {algo.quantumSafe ? 'Safe' : 'Vulnerable'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{algo.status}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredAlgorithms.length === 0 && (
              <div className="p-8 text-center text-slate-500">No algorithms found matching your search.</div>
            )}
          </div>
        </motion.div>
      ),
    },
    {
      label: 'NIST Standards',
      value: 'nist',
      content: (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {NIST_STANDARDS.map((standard, idx) => (
              <motion.div variants={itemVariants} key={idx} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 hover:border-cyan-500/50 hover:bg-slate-900 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <Badge variant="default" className="border border-slate-700 bg-slate-950/50">{standard.year}</Badge>
                </div>
                <h3 className="font-bold text-xl text-white mb-2">{standard.algorithm}</h3>
                <p className="text-sm text-slate-400 mb-6 line-clamp-3">{standard.description}</p>
                <div className="pt-4 border-t border-slate-800">
                  <Badge variant="low" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    {standard.type}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ),
    },
    {
      label: 'Comparison & Complexity Chart',
      value: 'comparison',
      content: (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="bg-slate-900/60 rounded-3xl border border-red-500/20 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl" />
              <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" /> RSA-2048
              </h3>
              <ul className="text-sm space-y-3 text-slate-300 relative z-10">
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Time Complexity</span> <span className="font-mono">O(log³ n)</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Key Size</span> <span className="font-mono">2048 bits</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Status</span> <Badge variant="critical">Vulnerable</Badge>
                </li>
                <li className="flex justify-between pt-1">
                  <span className="text-slate-500">PQC Safe?</span> <span className="text-red-400 font-bold">No</span>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-slate-900/60 rounded-3xl border border-orange-500/20 p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
              <h3 className="font-bold text-xl text-white mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" /> ECC-256
              </h3>
              <ul className="text-sm space-y-3 text-slate-300 relative z-10">
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Time Complexity</span> <span className="font-mono">O(log n)</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Key Size</span> <span className="font-mono">256 bits</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Status</span> <Badge variant="high">Vulnerable</Badge>
                </li>
                <li className="flex justify-between pt-1">
                  <span className="text-slate-500">PQC Safe?</span> <span className="text-orange-400 font-bold">No</span>
                </li>
              </ul>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-slate-900/60 rounded-3xl border border-cyan-500/40 p-6 relative overflow-hidden group shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
              <h3 className="font-bold text-xl text-cyan-400 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Kyber (ML-KEM)
              </h3>
              <ul className="text-sm space-y-3 text-slate-300 relative z-10">
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Type</span> <span className="font-semibold text-white">Lattice-based</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">NIST Status</span> <span className="font-semibold text-white">FIPS 203</span>
                </li>
                <li className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500">Status</span> <Badge variant="low" className="bg-cyan-500/20 text-cyan-300">Secure</Badge>
                </li>
                <li className="flex justify-between pt-1">
                  <span className="text-slate-500">PQC Safe?</span> <span className="text-cyan-400 font-bold">Yes ✓</span>
                </li>
              </ul>
            </motion.div>
          </div>
          
          <motion.div variants={itemVariants} className="bg-slate-900/60 rounded-3xl border border-slate-800 p-6 md:p-8 backdrop-blur-xl">
            <h3 className="font-bold text-2xl text-white mb-2 flex items-center gap-3">
              <Activity className="w-6 h-6 text-purple-400" /> Attack Complexity Matrix
            </h3>
            <p className="text-slate-400 text-sm mb-8">Analyzing classical (NFS) vs quantum (Shor's) computational requirements based on key size.</p>
            
            <div className="h-96 w-full p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { bits: 128, classical: 10, quantum: 2 },
                    { bits: 256, classical: 20, quantum: 4 },
                    { bits: 512, classical: 40, quantum: 8 },
                    { bits: 1024, classical: 80, quantum: 16 },
                    { bits: 2048, classical: 160, quantum: 32 }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="bits" stroke="#64748b" label={{ value: 'Cryptographic Key Size (Bits)', position: 'bottom', offset: 0, fill: '#94a3b8' }} tickMargin={10} />
                  <YAxis stroke="#64748b" label={{ value: 'Operations (Log Scale ~)', angle: -90, position: 'insideLeft', fill: '#94a3b8', dy: 50 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }} 
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="classical" name="Classical Attack (NFS)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="quantum" name="Quantum Attack (Shor's)" stroke="#a855f7" strokeWidth={3} dot={{ r: 5, fill: '#a855f7', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-4">
              <BookOpen className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-300">
                <strong>Crucial Observation:</strong> Quantum operational complexity (Purple line) scales <span className="text-purple-300 font-semibold">linearly</span> rather than exponentially when factoring large primes. This makes RSA-2048 computationally trivial for a large-scale quantum computer, reducing thousands of years of classical computing time to mere hours.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[95%] xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-medium text-xs mb-4">
              <Database className="w-4 h-4" /> Cryptographic Standards Directory
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight flex items-center gap-4">
              Algorithm Comparison
            </h1>
            <p className="text-slate-400 mt-4 max-w-2xl">
              A comprehensive directory of classical and post-quantum cryptographic algorithms, analyzed for vulnerability against quantum computers.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-xl shadow-2xl p-6 md:p-8">
            <Tabs tabs={algorithmTabs} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
