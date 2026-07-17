import React, { useState } from 'react';
import { Shield, ChevronRight, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot trap
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      setStatus(null);
      await api.post('/threats/newsletter', { email, website });
      setStatus('Success! Check your email inbox.');
      setEmail('');
      setWebsite('');
    } catch (err: any) {
      if (err.response?.data?.message) {
        setStatus(err.response.data.message);
      } else {
        setStatus('Failed to subscribe. Try again.');
      }
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
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="block w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {/* Honeypot Trap - Invisible to real users, but bots will fill it */}
                  <input
                    type="text"
                    name="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Subscribing...</>
                  ) : (
                    'Subscribe'
                  )}
                </button>
                {status && (
                  <p className={`text-xs flex items-center gap-1 ${status.includes('Success') ? 'text-green-400' : status.toLowerCase().includes('already') ? 'text-yellow-400' : 'text-red-400'}`}>
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
