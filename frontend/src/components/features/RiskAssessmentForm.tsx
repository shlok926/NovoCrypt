import React from 'react';
import { Button } from '../ui/Button';

interface RiskAssessmentFormProps {
  onSubmit?: (data: {
    industry: string;
    dataType: string;
    encryption: string;
    dataLifetime: number;
  }) => void;
  loading?: boolean;
}

export const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onSubmit, loading = false }) => {
  const [industry, setIndustry] = React.useState('finance');
  const [dataType, setDataType] = React.useState('financial');
  const [encryption, setEncryption] = React.useState('rsa_2048');
  const [dataLifetime, setDataLifetime] = React.useState('10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      industry,
      dataType,
      encryption,
      dataLifetime: parseInt(dataLifetime),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-800 bg-white p-6">
      <h2 className="text-2xl font-bold text-white">Quantum Risk Assessment</h2>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="government">Government</option>
            <option value="technology">Technology</option>
            <option value="energy">Energy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Data Type</label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="financial">Financial Records</option>
            <option value="health">Health Records</option>
            <option value="confidential">Confidential Documents</option>
            <option value="personal">Personal Data</option>
            <option value="public">Public Data</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Current Encryption</label>
          <select
            value={encryption}
            onChange={(e) => setEncryption(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="rsa_2048">RSA-2048</option>
            <option value="rsa_4096">RSA-4096</option>
            <option value="ecc_256">ECC-256</option>
            <option value="none">None/Unencrypted</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Data Lifetime (years)</label>
          <input
            type="number"
            value={dataLifetime}
            onChange={(e) => setDataLifetime(e.target.value)}
            disabled={loading}
            min="1"
            max="50"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? 'Calculating...' : 'Calculate Risk Score'}
      </Button>
    </form>
  );
};
