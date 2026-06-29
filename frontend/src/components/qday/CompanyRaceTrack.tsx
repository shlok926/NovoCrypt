import { motion } from 'framer-motion';

const companies = [
  { name: 'IBM', country: '🇺🇸', type: 'Superconducting', physical: 1121, logical: 0, target: '2029 (200 LQ)' },
  { name: 'Google', country: '🇺🇸', type: 'Superconducting', physical: 105, logical: 1, target: '2030 (1M PQ)' },
  { name: 'Quantinuum', country: '🇺🇸/🇬🇧', type: 'Trapped-ion', physical: 98, logical: 48, target: '2030 (100s LQ)' },
  { name: 'QuEra', country: '🇺🇸', type: 'Neutral atom', physical: 448, logical: 96, target: 'Scaling' },
  { name: 'Origin Quantum', country: '🇨🇳', type: 'Superconducting', physical: 180, logical: 0, target: 'Scaling' },
  { name: 'QpiAI', country: '🇮🇳', type: 'Superconducting', physical: 64, logical: 0, target: '2030 (100 LQ)' },
];

export default function CompanyRaceTrack() {
  const maxLogical = 100; // Normalizing for UI

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-2">Global Quantum Race Track</h3>
        <p className="text-slate-400 text-sm">
          Tracking the progress of top companies toward Fault-Tolerant Quantum Computing (FTQC).
          The goal is reaching thousands of <strong>Logical Qubits (LQ)</strong> to break RSA.
        </p>
      </div>

      <div className="space-y-6">
        {companies.map((company, idx) => (
          <div key={company.name} className="relative">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h4 className="text-white font-semibold flex items-center gap-2">
                  {company.name} <span className="text-sm">{company.country}</span>
                </h4>
                <p className="text-xs text-slate-500">{company.type} • Target: {company.target}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-400 font-bold">{company.logical > 0 ? company.logical : company.physical}</p>
                <p className="text-xs text-slate-500">{company.logical > 0 ? 'Logical Qubits' : 'Physical Qubits'}</p>
              </div>
            </div>

            {/* Track Background */}
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden relative">
              {/* Progress Fill */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((company.logical > 0 ? company.logical : company.physical / 20) / maxLogical * 100, 100)}%` }}
                transition={{ duration: 1.5, delay: idx * 0.1 }}
                className={`h-full rounded-full ${company.logical > 0 ? 'bg-gradient-to-r from-purple-500 to-purple-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 opacity-50'}`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-800 flex gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          Logical Qubits (Error Corrected)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 opacity-50" />
          Physical Qubits (Raw)
        </div>
      </div>
    </div>
  );
}
