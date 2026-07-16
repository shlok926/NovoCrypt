import { useState, useEffect } from 'react';
import { ChevronRight, Check, AlertCircle, DollarSign, Clock, Users } from 'lucide-react';
import { migrationService } from '@/services/threatMigrationService';
import { MigrationPlan, MigrationTemplates } from '@/types/threat-migration.types';

export default function MigrationPlanner() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<MigrationTemplates | null>(null);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [formData, setFormData] = useState({
    organizationSize: '',
    industry: '',
    currentCrypto: [] as string[],
    budget: 'medium',
    timeline: 'standard'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const temps = await migrationService.getMigrationTemplates();
        setTemplates(temps);
      } catch (err: any) {
        setError('Failed to load migration templates.');
      }
    };
    loadTemplates();
  }, []);

  const handleCurrentCryptoChange = (algo: string) => {
    setFormData(prev => ({
      ...prev,
      currentCrypto: prev.currentCrypto.includes(algo)
        ? prev.currentCrypto.filter(a => a !== algo)
        : [...prev.currentCrypto, algo]
    }));
  };

  const handleGeneratePlan = async () => {
    if (!formData.organizationSize || !formData.industry || formData.currentCrypto.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const generatedPlan = await migrationService.generateMigrationPlan(formData);
      if (generatedPlan) {
        setPlan(generatedPlan);
        setStep(5);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate migration plan.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Organization Profile', icon: '🏢' },
    { number: 2, title: 'Current Cryptography', icon: '🔐' },
    { number: 3, title: 'Resources & Timeline', icon: '⏱️' },
    { number: 4, title: 'Budget & Constraints', icon: '💰' },
    { number: 5, title: 'Migration Roadmap', icon: '🗺️' }
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-white mb-2">Migration Planner</h1>
          <p className="text-gray-300 text-lg">
            5-Step Wizard to Generate Your Quantum-Safe Migration Roadmap
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition ${
                    step >= s.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-gray-400'
                  }`}
                >
                  {step > s.number ? <Check className="w-5 h-5" /> : s.number}
                </div>
                <span className="text-xs text-gray-400 text-center hidden md:block">{s.title}</span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-400 w-6 h-6 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Step 1: Organization Profile */}
        {step === 1 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Organization Profile</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-3">Organization Size *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {templates?.organizationSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setFormData({ ...formData, organizationSize: size })}
                      className={`p-4 rounded-lg font-medium transition ${
                        formData.organizationSize === size
                          ? 'bg-blue-600 text-white border-2 border-blue-400'
                          : 'bg-slate-700 text-gray-300 border-2 border-transparent hover:border-slate-600'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-3">Industry *</label>
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Industry</option>
                  {templates?.industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind.charAt(0).toUpperCase() + ind.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                onClick={() => setStep(2)}
                disabled={!formData.organizationSize || !formData.industry}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Current Cryptography */}
        {step === 2 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Current Cryptography Setup</h2>
            <p className="text-gray-400 mb-6">Select the cryptographic algorithms currently used in your systems *</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {templates?.commonCryptoAlgorithms.map((algo) => (
                <label
                  key={algo}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                    formData.currentCrypto.includes(algo)
                      ? 'bg-blue-900 border-blue-500'
                      : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.currentCrypto.includes(algo)}
                    onChange={() => handleCurrentCryptoChange(algo)}
                    className="mr-2"
                  />
                  <span className="text-white font-medium">{algo}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={formData.currentCrypto.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Resources & Timeline */}
        {step === 3 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Resources & Timeline</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-3">Migration Timeline</label>
                <div className="grid grid-cols-3 gap-3">
                  {['urgent', 'standard', 'flexible'].map((timeline) => (
                    <button
                      key={timeline}
                      onClick={() => setFormData({ ...formData, timeline: timeline as any })}
                      className={`p-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        formData.timeline === timeline
                          ? 'bg-blue-600 text-white border-2 border-blue-400'
                          : 'bg-slate-700 text-gray-300 border-2 border-transparent hover:border-slate-600'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      {timeline.charAt(0).toUpperCase() + timeline.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  {formData.timeline === 'urgent' && '6-12 months - Accelerated migration with focused resources'}
                  {formData.timeline === 'standard' && '12-18 months - Balanced approach with adequate planning'}
                  {formData.timeline === 'flexible' && '18-24 months - Gradual migration with minimal disruption'}
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Budget & Constraints */}
        {step === 4 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Budget & Constraints</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-300 font-semibold mb-3">Budget Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map((budget) => (
                    <button
                      key={budget}
                      onClick={() => setFormData({ ...formData, budget: budget as any })}
                      className={`p-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                        formData.budget === budget
                          ? 'bg-blue-600 text-white border-2 border-blue-400'
                          : 'bg-slate-700 text-gray-300 border-2 border-transparent hover:border-slate-600'
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      {budget.charAt(0).toUpperCase() + budget.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  <strong>Note:</strong> Budget affects resource allocation and project timeline. Higher budgets allow for faster migration and better tooling.
                </p>
              </div>
            </div>

            <div className="flex justify-between gap-4 mt-8">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                Back
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2 transition"
              >
                {loading ? 'Generating...' : 'Generate Roadmap'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Migration Roadmap */}
        {step === 5 && plan && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400 text-sm font-semibold">Timeline</span>
                </div>
                <p className="text-2xl font-bold text-white">{plan.timeline}</p>
                <p className="text-gray-500 text-xs mt-1">Complete by {plan.completionDate}</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400 text-sm font-semibold">Estimated Cost</span>
                </div>
                <p className="text-2xl font-bold text-white">${(plan.estimatedCost.total / 1000).toFixed(0)}K</p>
                <p className="text-gray-500 text-xs mt-1">For {plan.organizationSize} organization</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400 text-sm font-semibold">Recommended</span>
                </div>
                <p className="text-white font-semibold">{plan.recommendedAlgorithms.slice(0, 2).join(', ')}</p>
                <p className="text-gray-500 text-xs mt-1">+ {plan.recommendedAlgorithms.length - 2} more algorithms</p>
              </div>
            </div>

            {/* Migration Steps */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">5-Step Migration Roadmap</h2>
              <div className="space-y-4">
                {plan.steps.map((step) => (
                  <div key={step.number} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">{step.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-500 text-xs font-semibold mb-2">Duration</p>
                            <p className="text-white text-sm">{step.duration}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs font-semibold mb-2">Estimated Cost</p>
                            <p className="text-white text-sm">${(step.estimatedCost / 1000).toFixed(0)}K</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-gray-500 text-xs font-semibold mb-2">Key Tasks</p>
                          <ul className="space-y-1">
                            {step.tasks.map((task, idx) => (
                              <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                                <span className="text-green-400 mt-1">✓</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs font-semibold mb-2">Resources Required</p>
                          <div className="flex flex-wrap gap-2">
                            {step.resources.map((resource) => (
                              <span key={resource} className="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded">
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risks */}
            {plan.risks.length > 0 && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-300" />
                  <h3 className="text-lg font-semibold text-red-100">Identified Risks</h3>
                </div>
                <ul className="space-y-2">
                  {plan.risks.map((risk, idx) => (
                    <li key={idx} className="text-red-100 text-sm flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success Criteria */}
            <div className="bg-green-900 border border-green-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-100 mb-4">Success Criteria</h3>
              <ul className="space-y-2">
                {plan.successCriteria.map((criterion, idx) => (
                  <li key={idx} className="text-green-100 text-sm flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-4">
              <button
                onClick={() => {
                  setStep(1);
                  setPlan(null);
                  setFormData({
                    organizationSize: '',
                    industry: '',
                    currentCrypto: [],
                    budget: 'medium',
                    timeline: 'standard'
                  });
                }}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
              >
                Create New Plan
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const text = JSON.stringify(plan, null, 2);
                    const blob = new Blob([text], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `migration-plan-${plan.id}.json`;
                    a.click();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Download Plan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
