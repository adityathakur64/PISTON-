import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/firebase';
import { Lock, Mail, AlertTriangle, Key } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }
    try {
      setError('');
      setLoading(true);
      await authService.login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username: string) => {
    try {
      setLoading(true);
      setError('');
      // In mock mode, password is not validated, email is username@piston.com
      await authService.login(`${username}@piston.com`, 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to perform quick login.');
    } finally {
      setLoading(false);
    }
  };

  const seedUsers = [
    { username: 'piston_legend_real', label: 'Legend (64.2k GR)', color: 'border-orange-500/40 hover:border-orange-500 text-orange-400' },
    { username: 'carbon_porsche', label: 'Exotic (28.4k GR)', color: 'border-red-500/40 hover:border-red-500 text-red-400' },
    { username: 'drift_shogun', label: 'Elite (14.2k GR)', color: 'border-amber-500/40 hover:border-amber-500 text-amber-400' },
    { username: 'muscle_chef', label: 'Warrior (8.2k GR)', color: 'border-purple-500/40 hover:border-purple-500 text-purple-400' },
    { username: 'miata_matt', label: 'Enthusiast (1.8k GR)', color: 'border-green-500/40 hover:border-green-500 text-green-400' },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <span className="bg-brand-orange text-black font-black text-3xl px-4 py-1.5 rounded-md font-display tracking-widest inline-block">
            PISTON
          </span>
          <h2 className="mt-4 text-2xl font-display font-extrabold text-white uppercase tracking-wider">
            Sign In to the Garage
          </h2>
          <p className="mt-1.5 text-xs text-zinc-400 tracking-wide">
            Compete for Garage Reputation, not followers.
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

          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="driver@piston.com"
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
                  placeholder="••••••••"
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
                'ENTER GARAGE'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-xs text-zinc-500">Don't have an account? </span>
            <Link to="/signup" className="text-xs text-brand-orange font-bold hover:underline">
              Create a Build Profile
            </Link>
          </div>
        </div>

        {/* Quick login box */}
        <div className="glass-panel rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Key size={14} className="text-brand-orange" />
            <span className="text-xs font-display font-bold uppercase tracking-widest text-zinc-300">
              Quick Test Accounts (Mock Mode)
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Click any pre-seeded enthusiast below to log in and inspect their custom garage, reputation score, and badges:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {seedUsers.map((user) => (
              <button
                key={user.username}
                onClick={() => handleQuickLogin(user.username)}
                disabled={loading}
                className={`text-left text-xs font-display border p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-all font-semibold ${user.color}`}
              >
                @{user.username}
                <div className="text-[10px] opacity-70 font-sans mt-0.5">{user.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
