import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Bookmark,
  Crown,
  Gauge,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  ShieldCheck,
  Star,
  TrendingUp,
} from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import type { CarData, UserProfile } from '../services/reputationService';
import { BADGES, getGarageRank } from '../services/reputationService';
import BadgeEmblem from '../components/BadgeEmblem';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async (uid: string) => {
    try {
      const userProfile = await dbService.getUserProfile(uid);
      const userCars = await dbService.getUserCars(uid);
      setProfile(userProfile);
      setCars(userCars);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      if (user) {
        loadDashboardData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-brand-orange"></div>
        <span className="mt-3 font-display text-sm uppercase tracking-widest text-zinc-500">
          Syncing Garage Stats
        </span>
      </div>
    );
  }

  if (!profile) return null;

  const rankInfo = getGarageRank(profile.garageReputation);
  const featuredCar = cars[0];
  const storyCars = cars.length > 0 ? cars : [];
  const trendingTags = [
    ['#pistonlife', '12.4K posts'],
    ['#jdm', '8.7K posts'],
    ['#tracklife', '6.1K posts'],
    ['#supercars', '5.4K posts'],
    ['#builtnotbought', '3.2K posts'],
  ];

  return (
    <div className="grid gap-6 animate-fadeIn xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-5">
        <div className="rounded-xl border hairline bg-black/40 p-4">
          <div className="flex gap-5 overflow-x-auto pb-1">
            <Link to="/upload" className="w-20 shrink-0 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-dashed border-brand-orange/70 bg-black text-brand-orange transition hover:bg-brand-orange/10">
                <Plus size={22} />
              </div>
              <div className="mt-2 truncate text-[11px] font-semibold text-zinc-400">Your Story</div>
            </Link>

            {storyCars.slice(0, 8).map((car) => (
              <div key={car.id} className="w-20 shrink-0 text-center">
                <div className="mx-auto h-16 w-16 rounded-full border-2 border-brand-orange p-0.5 shadow-[0_0_20px_rgba(232,93,4,0.12)]">
                  <img
                    src={car.photos[0]}
                    alt={`${car.make} ${car.model}`}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div className="mt-2 truncate text-[11px] font-semibold text-zinc-400">
                  {car.model}
                </div>
              </div>
            ))}
          </div>
        </div>

        {featuredCar ? (
          <article className="glass-panel overflow-hidden rounded-xl">
            <header className="flex items-center justify-between border-b hairline px-4 py-3">
              <div className="flex items-center gap-3">
                <img
                  src={profile.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400'}
                  alt={profile.displayName}
                  className="h-10 w-10 rounded-full border border-brand-orange/45 object-cover"
                />
                <div>
                  <div className="text-sm font-bold text-white">{profile.username}</div>
                  <div className="text-[11px] text-zinc-500">
                    {featuredCar.year} {featuredCar.make} {featuredCar.model}
                  </div>
                </div>
              </div>
              <button className="rounded-lg p-2 text-zinc-500 hover:bg-bg-input hover:text-white" title="More">
                <MoreHorizontal size={18} />
              </button>
            </header>

            <div className="relative aspect-[4/3] bg-black sm:aspect-[16/10]">
              <img
                src={featuredCar.photos[0]}
                alt={`${featuredCar.year} ${featuredCar.make} ${featuredCar.model}`}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 rounded-full bg-black/72 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-orange backdrop-blur">
                {featuredCar.rarity}
              </div>
              {featuredCar.isVerified && (
                <div className="absolute right-4 top-4 rounded-full bg-brand-orange p-2 text-black" title="Verified Ride">
                  <ShieldCheck size={16} />
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-zinc-200">
                  <button className="transition hover:text-brand-orange" title="Like">
                    <Heart size={21} />
                  </button>
                  <button className="transition hover:text-brand-orange" title="Comment">
                    <MessageCircle size={21} />
                  </button>
                  <button className="transition hover:text-brand-orange" title="Share">
                    <Send size={21} />
                  </button>
                </div>
                <button className="text-zinc-300 transition hover:text-brand-orange" title="Save">
                  <Bookmark size={21} />
                </button>
              </div>

              <div className="text-xs font-bold text-zinc-300">
                {featuredCar.upvotes.toLocaleString()} likes
              </div>
              <p className="text-sm leading-relaxed text-zinc-300">
                <span className="font-bold text-white">{profile.username}</span>{' '}
                {featuredCar.description || 'Built for night runs, clean lines, and real garage reputation.'}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="text-brand-orange">#pistonlife</span>
                <span className="text-brand-orange">#garagebuilt</span>
                <span className="text-brand-orange">#{featuredCar.make.toLowerCase()}</span>
              </div>
            </div>
          </article>
        ) : (
          <div className="glass-panel rounded-xl p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border hairline bg-bg-input text-brand-orange">
              <Gauge size={24} />
            </div>
            <h2 className="mt-4 font-display text-3xl tracking-wide text-white">Start Your Garage Feed</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Upload your first build to turn your garage into a PISTON status profile.
            </p>
            <Link
              to="/upload"
              className="mt-5 inline-flex rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-extrabold text-black transition hover:bg-brand-orange-hover"
            >
              Upload Car
            </Link>
          </div>
        )}

        {cars.length > 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {cars.slice(1).map((car) => (
              <div key={car.id} className="glass-panel group overflow-hidden rounded-xl">
                <div className="relative h-40 bg-black">
                  <img
                    src={car.photos[0]}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-3 left-3 rounded bg-black/72 px-2 py-1 text-[10px] font-black text-brand-orange backdrop-blur">
                    +{car.calculatedScore?.toLocaleString()} GR
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="font-display text-2xl leading-none tracking-wide text-white">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span className="uppercase">{car.rarity}</span>
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Star size={12} className="fill-brand-orange stroke-brand-orange" />
                      {car.buildQuality}/10
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Garage Reputation
              </div>
              <div className="mt-2 font-display text-5xl leading-none tracking-wide text-brand-orange">
                {profile.garageReputation.toLocaleString()}
                <span className="ml-1 text-xl text-white">GR</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-orange">
                <TrendingUp size={13} />
                <span>1,250 this week</span>
              </div>
            </div>
            <svg viewBox="0 0 120 70" className="h-20 w-28 text-brand-orange">
              <polyline
                points="4,62 20,50 35,55 50,38 66,43 82,24 96,28 116,8"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M4 62 L20 50 L35 55 L50 38 L66 43 L82 24 L96 28 L116 8 V70 H4 Z" fill="currentColor" opacity="0.12" />
            </svg>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Rank</div>
              <div className="mt-2 text-2xl font-bold text-white">{rankInfo.current.title}</div>
            </div>
            <div className="grid h-14 w-14 place-items-center rounded-xl border border-brand-orange/45 bg-brand-orange/10 text-brand-orange">
              <Crown size={25} />
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black">
            <div className="h-full rounded-full bg-brand-orange" style={{ width: `${rankInfo.progress}%` }} />
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Award size={17} className="text-brand-orange" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Badges</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {BADGES.map((badge) => {
              const isEarned = profile.badges.includes(badge.id);
              return (
                <div key={badge.id} title={badge.name} className="flex justify-center">
                  <BadgeEmblem badgeId={badge.id} label={badge.name} earned={isEarned} size="sm" />
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5">
          <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Trending</div>
          <div className="space-y-3">
            {trendingTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200">{tag}</span>
                <span className="text-zinc-500">{count}</span>
              </div>
            ))}
          </div>
          <button className="mt-5 text-xs font-bold text-brand-orange">See more</button>
        </div>
      </aside>
    </div>
  );
}
