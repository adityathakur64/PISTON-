import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Car,
  ChevronDown,
  Compass,
  Home,
  LogOut,
  MessageCircle,
  Plus,
  PlusSquare,
  Search,
  Settings,
  Trophy,
  User,
  Video,
} from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import type { UserProfile } from '../services/reputationService';
import PistonLogo from './PistonLogo';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  name: string;
  path?: string;
  icon: React.ElementType;
};

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

  const navItems: NavItem[] = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Explore', path: '/leaderboard', icon: Compass },
    { name: 'Upload', path: '/upload', icon: PlusSquare },
    { name: 'Garage', path: '/', icon: Car },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Reels', icon: Video },
    { name: 'Notifications', icon: Bell },
    { name: 'Messages', icon: MessageCircle },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', icon: Settings },
  ];

  const mobileItems = navItems.filter((item) => ['Home', 'Explore', 'Upload', 'Garage', 'Profile'].includes(item.name));
  const authenticated = Boolean(currentUser && profile);

  return (
    <div className="min-h-screen bg-bg-dark bg-grid-pattern text-zinc-100 pb-20 md:pb-0">
      {authenticated && (
        <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r hairline bg-black/90 backdrop-blur-xl">
          <div className="px-7 pt-7 pb-6 border-b hairline">
            <Link to="/" className="block">
              <PistonLogo size="md" />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path ? location.pathname === item.path : false;
              const className = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-orange/28 text-white border border-brand-orange/45 shadow-[0_0_24px_rgba(232,93,4,0.10)]'
                  : item.path
                    ? 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                    : 'text-zinc-600 cursor-default'
              }`;

              if (!item.path) {
                return (
                  <button key={item.name} type="button" className={className} disabled>
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              }

              return (
                <Link key={`${item.name}-${item.path}`} to={item.path} className={className}>
                  <Icon size={18} className={isActive ? 'text-brand-orange' : ''} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <Link
              to="/upload"
              className="mt-5 flex items-center justify-between rounded-lg border border-brand-orange/40 bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-orange hover:text-black"
            >
              <span>Create Post</span>
              <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-orange text-black">
                <Plus size={16} />
              </span>
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

      {authenticated && (
        <header className="hidden md:flex fixed left-64 right-0 top-0 z-30 h-20 items-center justify-between border-b hairline bg-black/72 px-7 backdrop-blur-xl">
          <div className="relative w-full max-w-xl">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              placeholder="Search cars, users, hashtags..."
              className="field-surface h-11 w-full rounded-lg pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="ml-6 flex items-center gap-4">
            <Link
              to="/upload"
              className="grid h-10 w-10 place-items-center rounded-lg border hairline text-zinc-300 transition hover:border-brand-orange/50 hover:text-brand-orange"
              title="Create post"
            >
              <Plus size={18} />
            </Link>
            <button className="grid h-10 w-10 place-items-center rounded-lg border hairline text-zinc-300 transition hover:border-brand-orange/50 hover:text-brand-orange" title="Notifications">
              <Bell size={18} />
            </button>
            <Link to="/profile" className="flex items-center gap-3">
              <img
                src={profile?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400'}
                alt={profile?.displayName}
                className="h-10 w-10 rounded-full border border-brand-orange/35 object-cover"
              />
              <span className="text-sm font-bold text-white">{profile?.username}</span>
              <ChevronDown size={15} className="text-zinc-500" />
            </Link>
          </div>
        </header>
      )}

      <header className="sticky top-0 z-40 border-b hairline bg-black/90 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <PistonLogo size="sm" />
          </Link>

          {authenticated ? (
            <div className="flex items-center gap-2">
              <div className="rounded-lg border hairline px-2 py-1 text-[10px] font-bold text-brand-orange">
                {profile?.garageReputation.toLocaleString()} GR
              </div>
              <button className="rounded-lg p-2 text-zinc-400 hover:bg-bg-input hover:text-white" title="Calendar">
                <Calendar size={17} />
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

      <main className={`mx-auto w-full p-4 md:p-7 ${authenticated ? 'max-w-[1360px] md:ml-64 md:pt-24' : 'max-w-7xl'}`}>
        {children}
      </main>

      {authenticated && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t hairline bg-black/94 px-3 py-2 backdrop-blur-xl md:hidden">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path ? location.pathname === item.path : false;
            return (
              <Link
                key={`${item.name}-${item.path}-mobile`}
                to={item.path || '/'}
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
