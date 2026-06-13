import {
  BadgeCheck,
  Crown,
  Gauge,
  ShieldCheck,
  Trophy,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

interface BadgeEmblemProps {
  badgeId: string;
  label: string;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const BADGE_STYLES: Record<
  string,
  {
    Icon: LucideIcon;
    tone: string;
    halo: string;
  }
> = {
  first_build: {
    Icon: Wrench,
    tone: 'from-orange-500/28 via-brand-orange/16 to-zinc-950 border-brand-orange/50 text-brand-orange',
    halo: 'bg-brand-orange/20',
  },
  heavy_modder: {
    Icon: Gauge,
    tone: 'from-sky-400/24 via-zinc-700/28 to-zinc-950 border-sky-400/40 text-sky-300',
    halo: 'bg-sky-400/16',
  },
  elite_tier: {
    Icon: Crown,
    tone: 'from-amber-300/30 via-brand-orange/14 to-zinc-950 border-amber-300/45 text-amber-200',
    halo: 'bg-amber-300/18',
  },
  verified_ride: {
    Icon: ShieldCheck,
    tone: 'from-emerald-400/24 via-zinc-700/22 to-zinc-950 border-emerald-400/45 text-emerald-300',
    halo: 'bg-emerald-400/16',
  },
  top_10: {
    Icon: Trophy,
    tone: 'from-violet-400/22 via-brand-orange/12 to-zinc-950 border-violet-300/45 text-violet-200',
    halo: 'bg-violet-400/16',
  },
};

const sizeClasses = {
  sm: {
    wrap: 'h-9 w-9 rounded-lg',
    icon: 16,
    notch: 'h-1 w-5',
  },
  md: {
    wrap: 'h-12 w-12 rounded-xl',
    icon: 21,
    notch: 'h-1.5 w-7',
  },
  lg: {
    wrap: 'h-16 w-16 rounded-2xl',
    icon: 28,
    notch: 'h-2 w-9',
  },
};

export default function BadgeEmblem({ badgeId, label, earned = true, size = 'md' }: BadgeEmblemProps) {
  const badge = BADGE_STYLES[badgeId] || {
    Icon: BadgeCheck,
    tone: 'from-zinc-500/18 via-zinc-800 to-zinc-950 border-zinc-600 text-zinc-300',
    halo: 'bg-zinc-500/12',
  };
  const Icon = badge.Icon;
  const sizes = sizeClasses[size];

  return (
    <div
      aria-label={label}
      title={label}
      className={`relative grid ${sizes.wrap} place-items-center overflow-hidden border bg-gradient-to-br shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition ${
        earned
          ? `${badge.tone} shadow-[0_12px_26px_rgba(0,0,0,0.32)]`
          : 'border-zinc-800 bg-zinc-950 text-zinc-700 grayscale opacity-45'
      }`}
    >
      <div className={`absolute -top-4 h-10 w-10 rounded-full blur-xl ${earned ? badge.halo : 'bg-zinc-800/20'}`} />
      <div className="absolute inset-x-2 top-1 h-px bg-white/20" />
      <Icon size={sizes.icon} strokeWidth={2.2} className="relative z-10" />
      <div className={`absolute bottom-1 rounded-full ${sizes.notch} ${earned ? 'bg-white/18' : 'bg-zinc-800'}`} />
    </div>
  );
}
