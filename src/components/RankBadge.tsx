import { Crown, Flame, Gauge, Gem, Shield, Trophy, Wrench, Zap } from 'lucide-react';
import type { ElementType } from 'react';
import { RANKS } from '../services/reputationService';

interface RankBadgeProps {
  rank: string;
  size?: 'sm' | 'md' | 'lg';
}

const RANK_ICONS: Record<string, ElementType> = {
  'Street Rookie': Shield,
  Enthusiast: Zap,
  Builder: Wrench,
  'Track Warrior': Trophy,
  'Garage Elite': Crown,
  'Exotic Owner': Gem,
  'PISTON Legend': Flame,
};

export default function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const rankInfo = RANKS.find((r) => r.title === rank) || RANKS[0];
  const Icon = RANK_ICONS[rank] || Gauge;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 border',
    md: 'text-xs px-3 py-1 border',
    lg: 'text-sm px-4 py-1.5 border-2',
  };

  const iconSize = size === 'lg' ? 16 : size === 'md' ? 14 : 12;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-display font-semibold tracking-wide uppercase transition-all duration-300
        ${rankInfo.badgeColor}
        ${sizeClasses[size]}
      `}
    >
      <Icon size={iconSize} />
      <span>{rankInfo.title}</span>
    </span>
  );
}
