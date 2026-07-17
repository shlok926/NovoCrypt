import React, { useState } from 'react';
import { Shield, ChevronRight, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setStatus(null);
      await api.post('/threats/newsletter', { email });
      setStatus('Success! Check your email inbox.');
      setEmail('');
    } catch (err) {
      setStatus('Failed to subscribe. Try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <footer className="bg-slate-950 border-t border-slate-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Col */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Novocrypt</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Prepare your infrastructure for the post-quantum era. Assess risks, learn about threats, and plan your migration before Q-Day.
            </p>
            <div className="flex items-center gap-4 text-sm font-medium">
              <a href="#" className="text-slate-500 hover:text-white transition-colors">GitHub</a>
              <a href="#" className="text-slate-500 hover:text-blue-400 transition-colors">Twitter</a>
              <a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Links Col 1 */}
          <div>
            <h3 className="text-white font-semibold mb-6">Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/lab" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Algorithm Lab
                </Link>
              </li>
              <li>
                <Link to="/risk" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Risk Calculator
                </Link>
              </li>
              <li>
                <Link to="/algorithms" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Comparisons
                </Link>
              </li>
              <li>
                <Link to="/scanner" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Threat Scanner
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2 */}
          <div>
            <h3 className="text-white font-semibold mb-6">Learn</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/learn" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  How RSA Works
                </Link>
              </li>
              <li>
                <Link to="/learn" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Shor's Algorithm
                </Link>
              </li>
              <li>
                <Link to="/threats" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  HNDL Attacks
                </Link>
              </li>
              <li>
                <Link to="/qday-tracker" className="text-slate-400 hover:text-blue-400 text-sm flex items-center gap-2 group">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  Q-Day Timeline
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Col */}
          <div>
            <h3 className="text-white font-semibold mb-6">Stay Updated</h3>
            <p className="text-slate-400 text-sm mb-4">
              Get the latest updates on quantum threats and NIST standards.
            </p>
            <form onSubmit={handleSubscribe} className="relative">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email" 
                disabled={loading}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <button 
                type="submit" 
                disabled={loading}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Subscribe'}
              </button>
              {status && (
                <p className={`mt-2 text-xs flex items-center gap-1 ${status.includes('Success') ? 'text-green-400' : 'text-red-400'}`}>
                  {status.includes('Success') && <CheckCircle className="w-3 h-3" />}
                  {status}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Novocrypt. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-slate-500 hover:text-white text-sm transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-slate-500 hover:text-white text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
