import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/firebase';
import { User, Lock, Mail, ChevronRight, AlertTriangle } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username || !displayName) {
      return setError('Please fill in all fields.');
    }
    if (username.length < 3) {
      return setError('Username must be at least 3 characters.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    try {
      setError('');
      setLoading(true);
      await authService.signup(email, password, username, displayName);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const cleanUsernameInput = (val: string) => {
    // Only allow lowercase, numbers, and underscores
    setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <span className="bg-brand-orange text-black font-black text-3xl px-4 py-1.5 rounded-md font-display tracking-widest inline-block">
            PISTON
          </span>
          <h2 className="mt-4 text-2xl font-display font-extrabold text-white uppercase tracking-wider">
            Create Build Profile
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400 tracking-wide">
            Register your garage and start earning Reputation.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
          {/* Accent glowing line */}
          <div className="absolute top-0 left-0 right-0 h-px accent-rail"></div>

          {error && (
            <div className="mb-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2.5 rounded-lg flex items-start gap-2 animate-shake">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                Display Name (Real Name / Crew Name)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Dominic Toretto"
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-2 field-surface rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                Username (Unique ID)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 font-display text-sm font-bold">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => cleanUsernameInput(e.target.value)}
                  placeholder="charger_69"
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-2 field-surface rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none font-mono"
                />
              </div>
              <p className="mt-1 text-[10px] text-zinc-500">
                Only letters, numbers, and underscores are allowed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toretto@dodge.com"
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-2 field-surface rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min 6 characters)"
                  disabled={loading}
                  className="block w-full pl-10 pr-3 py-2 field-surface rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-black font-display font-bold py-2 rounded-lg transition-all tracking-wider text-sm flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>CREATE PROFILE</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs text-zinc-500">Already registered? </span>
            <Link to="/login" className="text-xs text-brand-orange font-bold hover:underline">
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
