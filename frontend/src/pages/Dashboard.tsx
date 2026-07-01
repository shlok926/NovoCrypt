import React from 'react';
import { Card, Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldCheck, Activity, Zap, TrendingUp, Clock, AlertTriangle, 
  CheckCircle, FileText, Beaker, Users, ChevronRight, Lock
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        className="max-w-7xl mx-auto space-y-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl border-4 border-slate-950 shadow-lg">
              {user?.role === 'admin' ? '🛡️' : '👤'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                Welcome back, {user?.name || 'Commander'}
                {user?.role === 'admin' && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">Admin</span>}
              </h1>
              <p className="text-slate-400">Your Quantum Readiness Command Center</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/risk')} className="flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Activity className="w-4 h-4" /> New Scan
            </Button>
            <Button onClick={() => navigate('/community')} variant="secondary" className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Community
            </Button>
          </div>
        </motion.div>

        {/* Quick Stats Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div variants={itemVariants} className="md:col-span-1 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">System Readiness</p>
              <h3 className="text-3xl font-bold text-white mt-1">78<span className="text-lg text-slate-500">%</span></h3>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-1 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Vulnerabilities</p>
              <h3 className="text-3xl font-bold text-white mt-1">12<span className="text-lg text-slate-500"> found</span></h3>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="md:col-span-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 p-5 rounded-2xl border border-blue-500/20 flex items-center justify-between relative overflow-hidden">
            <div className="z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-semibold text-sm tracking-wider uppercase">Next Milestone</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Migrate Core Auth Services</h3>
              <p className="text-slate-400 text-sm max-w-sm">Upgrade standard RSA endpoints to ML-KEM encapsulation by Q3.</p>
            </div>
            <div className="hidden sm:block z-10 mr-4">
              <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">45%</span>
              </div>
            </div>
            <div className="absolute right-[-10%] top-[-50%] w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          </motion.div>
        </div>

        {/* Main Modules */}
        <motion.div variants={containerVariants} className="grid md:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:border-slate-700 transition-all duration-300">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Risk Assessment</h2>
            <p className="text-slate-400 mb-6 min-h-[48px] text-sm leading-relaxed">
              Scan your infrastructure for legacy cryptographic implementations vulnerable to Shor's algorithm.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs text-slate-500 bg-slate-950/50 px-3 py-2 rounded-md border border-slate-800/50">
                <span>Last Scan</span>
                <span className="text-slate-300">2 days ago</span>
              </div>
            </div>
            <Button onClick={() => navigate('/risk')} variant="primary" className="w-full">
              Run Assessment
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:border-slate-700 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
              <Beaker className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Algorithm Lab</h2>
            <p className="text-slate-400 mb-6 min-h-[48px] text-sm leading-relaxed">
              Experiment with NIST-approved PQC algorithms like CRYSTALS-Kyber and Dilithium in a sandboxed environment.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs text-slate-500 bg-slate-950/50 px-3 py-2 rounded-md border border-slate-800/50">
                <span>Active Experiments</span>
                <span className="text-slate-300">3 Sessions</span>
              </div>
            </div>
            <Button onClick={() => navigate('/lab')} className="w-full bg-purple-600 hover:bg-purple-500 text-white border-none shadow-[0_0_15px_rgba(147,51,234,0.4)]">
              Enter Lab
            </Button>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:border-slate-700 transition-all duration-300">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Migration Planner</h2>
            <p className="text-slate-400 mb-6 min-h-[48px] text-sm leading-relaxed">
              Build a strategic step-by-step roadmap for migrating your enterprise to quantum-safe architecture.
            </p>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs text-slate-500 bg-slate-950/50 px-3 py-2 rounded-md border border-slate-800/50">
                <span>Current Phase</span>
                <span className="text-emerald-400">Inventory & Discovery</span>
              </div>
            </div>
            <Button onClick={() => navigate('/migration-planner')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              View Roadmap
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Recent Activity List */}
        <motion.div variants={itemVariants} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Recent Activity
            </h2>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { icon: FileText, title: 'Compliance Report Generated', desc: 'NIST SP 800-175B readiness check completed.', time: '2 hours ago', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { icon: Lock, title: 'Algorithm Tested', desc: 'ML-KEM encapsulation performance benchmarked.', time: 'Yesterday', color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { icon: Users, title: 'Community Thread Created', desc: 'Asked a question about hybrid deployment architectures.', time: '3 days ago', color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
            ].map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 cursor-pointer">
                <div className={`p-3 rounded-lg ${activity.bg}`}>
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{activity.title}</h4>
                  <p className="text-sm text-slate-400">{activity.desc}</p>
                </div>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
};
