import { motion } from 'framer-motion';
import { Globe2, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

const countries = [
  { name: 'United States', flag: '🇺🇸', tier: 'Tier 1', deadline: '2035', status: 'Mandatory (CNSA 2.0)', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { name: 'France', flag: '🇫🇷', tier: 'Tier 2', deadline: '2030', status: 'Critical Infra Hard Horizon', color: 'text-red-400', bg: 'bg-red-500/10' },
  { name: 'Australia', flag: '🇦🇺', tier: 'Tier 3', deadline: '2030', status: 'Classical Crypto Banned', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { name: 'China', flag: '🇨🇳', tier: 'Tier 1', deadline: '~2029', status: 'Independent Standard', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { name: 'Canada', flag: '🇨🇦', tier: 'Tier 3', deadline: '2035', status: 'Priority Systems by 2031', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'European Union', flag: '🇪🇺', tier: 'Tier 2', deadline: '2035', status: 'Roadmaps due 2026', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'India', flag: '🇮🇳', tier: 'Tier 3', deadline: 'Ongoing', status: 'Prioritizing Aadhaar/UPI', color: 'text-green-400', bg: 'bg-green-500/10' },
];

export default function CountryReadinessMap() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl mt-8">
      <div className="flex items-center gap-3 mb-8">
        <Globe2 className="w-8 h-8 text-blue-500" />
        <div>
          <h3 className="text-xl font-bold text-white">Global PQC Migration Deadlines</h3>
          <p className="text-slate-400 text-sm">How nations are racing to defend against Q-Day.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {countries.map((country, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={country.name}
            className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl" title={country.name}>{country.flag}</span>
              <div>
                <h4 className="text-white font-medium">{country.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-700">{country.tier}</span>
                  <span className={`text-xs ${country.color}`}>{country.status}</span>
                </div>
              </div>
            </div>
            <div className={`px-3 py-2 rounded-lg ${country.bg} text-center min-w-[80px]`}>
              <Clock className={`w-4 h-4 mx-auto mb-1 ${country.color}`} />
              <span className={`text-sm font-bold ${country.color}`}>{country.deadline}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
