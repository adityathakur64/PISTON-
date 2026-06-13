import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Gauge, Home, LogOut, PlusSquare, Trophy, User } from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import type { UserProfile } from '../services/reputationService';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      if (user) {
        const userProfile = await dbService.getUserProfile(user.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, [location]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Upload', path: '/upload', icon: PlusSquare },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const authenticated = Boolean(currentUser && profile);

  return (
    <div className="min-h-screen bg-bg-dark bg-grid-pattern text-zinc-100 pb-20 md:pb-0">
      {authenticated && (
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r hairline bg-black/88 backdrop-blur-xl">
          <div className="px-6 pt-7 pb-5 border-b hairline">
            <Link to="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-brand-orange/45 bg-brand-orange/10 text-brand-orange">
                <Gauge size={22} />
              </div>
              <div>
                <div className="font-display text-4xl leading-none tracking-[0.16em] text-white">
                  PISTON
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-orange">
                  Your car. Your status.
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={`${item.name}-${item.path}`}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-orange/18 text-white border border-brand-orange/35'
                      : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-brand-orange' : ''} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <Link
              to="/upload"
              className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-3 text-sm font-extrabold text-black transition hover:bg-brand-orange-hover"
            >
              <PlusSquare size={17} />
              <span>New Post</span>
            </Link>
          </nav>

          <div className="m-4 rounded-xl border hairline bg-bg-card p-4">
            <Link to="/profile" className="flex items-center gap-3">
              <img
                src={profile?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400'}
                alt={profile?.displayName}
                className="h-11 w-11 rounded-full border border-brand-orange/40 object-cover"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-white">{profile?.displayName}</div>
                <div className="text-xs text-brand-orange">{profile?.garageReputation.toLocaleString()} GR</div>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border hairline px-3 py-2 text-xs font-bold text-zinc-400 transition hover:border-red-500/40 hover:text-red-400"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>
      )}

      <header className="sticky top-0 z-40 border-b hairline bg-black/88 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-brand-orange/40 bg-brand-orange/10 text-brand-orange">
              <Gauge size={18} />
            </div>
            <span className="font-display text-3xl leading-none tracking-[0.16em] text-white">PISTON</span>
          </Link>

          {authenticated ? (
            <div className="flex items-center gap-2">
              <div className="rounded-lg border hairline px-2 py-1 text-[10px] font-bold text-brand-orange">
                {profile?.garageReputation.toLocaleString()} GR
              </div>
              <button className="rounded-lg p-2 text-zinc-400 hover:bg-bg-input hover:text-white" title="Notifications">
                <Bell size={17} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-xs font-bold text-zinc-400">
                LOGIN
              </Link>
              <Link to="/signup" className="rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-extrabold text-black">
                SIGN UP
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className={`mx-auto w-full p-4 md:p-6 ${authenticated ? 'max-w-6xl md:ml-64' : 'max-w-7xl'}`}>
        {children}
      </main>

      {authenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t hairline bg-black/92 px-3 py-2 backdrop-blur-xl md:hidden">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={`${item.name}-${item.path}-mobile`}
                to={item.path}
                className={`flex min-w-12 flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition ${
                  isActive ? 'text-brand-orange' : 'text-zinc-500'
                }`}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
