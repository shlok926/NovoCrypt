import ProbabilityGauge from '../components/qday/ProbabilityGauge';
import ExpertPredictions from '../components/qday/ExpertPredictions';
import QDayScenarios from '../components/qday/QDayScenarios';
import CompanyRaceTrack from '../components/qday/CompanyRaceTrack';
import CountryReadinessMap from '../components/qday/CountryReadinessMap';
import { ScrollReveal } from '../components/ui/ScrollReveal';

export default function QDayTracker() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-12 mt-8">
            <h1 className="text-5xl font-bold text-white mb-4">Q-Day Timeline</h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Track global quantum computing progress based on real-world data (updated June 2026).
              Understand the race between hardware advancement and PQC migration.
            </p>
          </div>
        </ScrollReveal>

        {/* Global Race and Maps */}
        <ScrollReveal delay={0.1}>
          <section>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white">The Hardware Race</h2>
              <p className="text-slate-400 mt-2">Which companies are closest to reaching Cryptographically Relevant Quantum Computers (CRQC)?</p>
            </div>
            <CompanyRaceTrack />
          </section>
        </ScrollReveal>
        
        <ScrollReveal delay={0.2}>
          <section>
            <div className="mb-6 mt-16">
              <h2 className="text-3xl font-bold text-white">The Defense Race (Migration)</h2>
              <p className="text-slate-400 mt-2">National deadlines to ban classical cryptography and mandate PQC.</p>
            </div>
            <CountryReadinessMap />
          </section>
        </ScrollReveal>

        {/* Probability Gauge - Main Focus */}
        <ScrollReveal>
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Current Q-Day Probability</h2>
            <ProbabilityGauge />
          </section>
        </ScrollReveal>

        {/* Timeline Scenarios */}
        <ScrollReveal>
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Possible Scenarios</h2>
            <QDayScenarios />
          </section>
        </ScrollReveal>

        {/* Expert Predictions */}
        <ScrollReveal>
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Expert Predictions</h2>
            <ExpertPredictions />
          </section>
        </ScrollReveal>

        {/* Call to Action */}
        <ScrollReveal>
          <section className="mt-16 bg-gradient-to-br from-purple-900 to-slate-900 border border-purple-500/30 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">Don't wait until 2030.</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Adversaries are harvesting your data today to decrypt it when Q-Day arrives. Start assessing your risk now.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="px-8 py-3 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-lg transition-colors">
                Start Risk Assessment
              </button>
              <button className="px-8 py-3 border-2 border-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors">
                View Migration Planner
              </button>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
