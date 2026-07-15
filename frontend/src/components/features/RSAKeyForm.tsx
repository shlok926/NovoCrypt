import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RSAKeyFormProps {
  onSubmit?: (data: { p: number; q: number; e: number }) => void;
  loading?: boolean;
}

export const RSAKeyForm: React.FC<RSAKeyFormProps> = ({ onSubmit, loading = false }) => {
  const [p, setP] = React.useState('61');
  const [q, setQ] = React.useState('53');
  const [e, setE] = React.useState('17');

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    onSubmit?.({
      p: parseInt(p),
      q: parseInt(q),
      e: parseInt(e),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-800 bg-white p-6">
      <h3 className="font-semibold text-white">Generate RSA Key Pair</h3>
      
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Prime P</label>
          <Input
            type="number"
            value={p}
            onChange={(e) => setP(e.target.value)}
            min="2"
            max="10000"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">2-bit to 8-bit prime</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Prime Q</label>
          <Input
            type="number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            min="2"
            max="10000"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">2-bit to 8-bit prime</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Public Exponent E</label>
          <Input
            type="number"
            value={e}
            onChange={(e) => setE(e.target.value)}
            min="3"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">Usually 17 or 65537</p>
        </div>
      </div>

      <Button 
        type="submit" 
        variant="primary" 
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Generating...' : 'Generate Key Pair'}
      </Button>
    </form>
  );
};
