import { useState } from 'react';
import { PqcLabHeader } from '../components/playground/PqcLabHeader';
import { PqcLabControls } from '../components/playground/PqcLabControls';
import { PqcLabResults } from '../components/playground/PqcLabResults';
import { encryptMessage } from '../services/playgroundService';
import { EncryptionResult } from '../types/qday.types';

export default function Playground() {
  const [message, setMessage] = useState('TOP SECRET: Novocrypt Launch Codes 2026');
  const [activeTab, setActiveTab] = useState<'kyber' | 'rsa'>('kyber');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EncryptionResult | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await encryptMessage(message, activeTab === 'kyber' ? 'Kyber' : 'RSA', activeTab === 'kyber' ? 768 : 2048);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[0%] right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[0%] left-[10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
        <PqcLabHeader />

        <div className="grid lg:grid-cols-12 gap-8">
          <PqcLabControls 
            activeTab={activeTab} 
            setActiveTab={(tab) => { setActiveTab(tab); setResult(null); }} 
            message={message} 
            setMessage={setMessage} 
            handleSimulate={handleSimulate} 
            loading={loading} 
          />
          
          <PqcLabResults 
            activeTab={activeTab} 
            loading={loading} 
            result={result} 
          />
        </div>
      </div>
    </div>
  );
}
