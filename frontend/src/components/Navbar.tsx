import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface DropdownMenu {
  label: string;
  icon?: React.ReactNode;
  items: { label: string; href: string; icon?: string }[];
}

interface NavLink {
  label: string;
  href: string;
  icon?: string;
}

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  // Organized Navigation Structure
  const productMenu: DropdownMenu = {
    label: 'Product',
    items: [
      { label: 'Algorithm Lab', href: '/lab' },
      { label: 'Risk Calculator', href: '/risk' },
      { label: 'Q-Day Tracker', href: '/qday-tracker' },
      { label: 'Playground', href: '/playground' },
    ],
  };

  const learnMenu: DropdownMenu = {
    label: 'Learn',
    items: [
      { label: 'Learning Center', href: '/learn' },
      { label: 'Algorithms', href: '/algorithms' },
      { label: 'Documentation', href: '/learn' },
      { label: 'Blog', href: '/blog' },
    ],
  };

  const toolsMenu: DropdownMenu = {
    label: 'Tools',
    items: [
      { label: 'Security Workspace', href: '/scanner' },
      { label: 'Compliance Checker', href: '/compliance' },
      { label: 'Migration Planner', href: '/migration-planner' },
      { label: 'QuantumBot', href: '/quantum-bot' },
    ],
  };

  const mainLinks: NavLink[] = [
    { label: 'Home', href: '/' },
    { label: 'Threat Feed', href: '/threats' },
    { label: 'Community', href: '/community' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-cyan-500/20 shadow-lg backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - Enhanced */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg group-hover:shadow-cyan-500/50 transition-all">
              <span className="text-white font-bold text-lg">🛡️</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-300 transition-all">
              Novocrypt
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {/* Main Links */}
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Dropdown Menus */}
            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50 flex items-center gap-1 transition-all">
                {productMenu.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                {productMenu.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive(item.href)
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50 flex items-center gap-1 transition-all">
                {learnMenu.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                {learnMenu.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive(item.href)
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative group">
              <button className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800/50 flex items-center gap-1 transition-all">
                {toolsMenu.label}
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                {toolsMenu.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive(item.href)
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'text-cyan-400'
                      : 'text-slate-300 hover:text-cyan-300'
                  }`}
                >
                  Dashboard
                </Link>
                <span className="text-sm text-slate-400">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-cyan-400" />
            ) : (
              <Menu className="h-6 w-6 text-slate-300" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm py-4 md:hidden">
            <div className="space-y-2">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Dropdowns */}
              <div className="border-t border-slate-700 pt-2 mt-2">
                <details className="group">
                  <summary className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-300 cursor-pointer flex items-center justify-between">
                    {productMenu.label}
                    <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="bg-slate-800/50 rounded-lg mt-1 space-y-1">
                    {productMenu.items.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`block px-6 py-2 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-700'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
                <details className="group">
                  <summary className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-300 cursor-pointer flex items-center justify-between">
                    {learnMenu.label}
                    <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="bg-slate-800/50 rounded-lg mt-1 space-y-1">
                    {learnMenu.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className={`block px-6 py-2 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-700'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
                <details className="group">
                  <summary className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-300 cursor-pointer flex items-center justify-between">
                    {toolsMenu.label}
                    <ChevronDown className="h-4 w-4 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="bg-slate-800/50 rounded-lg mt-1 space-y-1">
                    {toolsMenu.items.map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`block px-6 py-2 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-cyan-400 bg-cyan-500/10'
                            : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-700'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
              </div>

              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-300 hover:bg-slate-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block rounded-lg px-4 py-2 text-sm font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
