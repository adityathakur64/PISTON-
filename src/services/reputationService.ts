export interface CarData {
  id: string;
  make: string;
  model: string;
  year: number;
  description: string;
  modifications: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'exotic' | 'hypercar';
  value: number;
  buildQuality: number;
  isVerified: boolean;
  upvotes: number;
  photos: string[];
  createdAt: number;
  calculatedScore?: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  profileImage: string;
  garageReputation: number;
  rank: string;
  badges: string[];
  createdAt: number;
}

export interface RankInfo {
  title: string;
  minGR: number;
  maxGR: number;
  colorClass: string;
  badgeColor: string;
}

export const RANKS: RankInfo[] = [
  { title: 'Street Rookie', minGR: 0, maxGR: 999, colorClass: 'text-gray-400', badgeColor: 'bg-gray-800 text-gray-300 border-gray-700' },
  { title: 'Enthusiast', minGR: 1000, maxGR: 2499, colorClass: 'text-green-500', badgeColor: 'bg-green-950/50 text-green-400 border-green-800' },
  { title: 'Builder', minGR: 2500, maxGR: 4999, colorClass: 'text-blue-500', badgeColor: 'bg-blue-950/50 text-blue-400 border-blue-800' },
  { title: 'Track Warrior', minGR: 5000, maxGR: 9999, colorClass: 'text-purple-500', badgeColor: 'bg-purple-950/50 text-purple-400 border-purple-800' },
  { title: 'Garage Elite', minGR: 10000, maxGR: 24999, colorClass: 'text-amber-500', badgeColor: 'bg-amber-950/50 text-amber-400 border-amber-800' },
  { title: 'Exotic Owner', minGR: 25000, maxGR: 49999, colorClass: 'text-red-500', badgeColor: 'bg-red-950/50 text-red-400 border-red-800' },
  { title: 'PISTON Legend', minGR: 50000, maxGR: Infinity, colorClass: 'text-brand-orange font-bold', badgeColor: 'bg-orange-950/30 text-brand-orange border-brand-orange/40' },
];

export const BADGES = [
  { id: 'first_build', name: 'First Build', description: 'Upload your first build to the garage', icon: 'wrench' },
  { id: 'heavy_modder', name: 'Heavy Modder', description: 'List 5 or more modifications on a car', icon: 'gauge' },
  { id: 'elite_tier', name: 'Elite Tier', description: 'Reach the Garage Elite rank', icon: 'crown' },
  { id: 'verified_ride', name: 'Verified Ride', description: 'Get a vehicle verified', icon: 'shield' },
  { id: 'top_10', name: 'Top 10 Contender', description: 'Rank in the top 10 on the global leaderboard', icon: 'trophy' },
];

export function calculateCarGR(car: Omit<CarData, 'id' | 'createdAt' | 'calculatedScore'>): number {
  const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.2,
    rare: 1.5,
    exotic: 2.0,
    hypercar: 3.0,
  };
  const multiplier = rarityMultipliers[car.rarity] || 1.0;
  const valuePoints = Math.floor(Math.log10(Math.max(1, car.value)) * 800);
  const buildQualityPoints = Math.min(10, Math.max(1, car.buildQuality)) * 250;
  const modPoints = Math.min(15, car.modifications.length) * 150;
  const engagementPoints = (car.upvotes || 0) * 50;
  const baseScore = valuePoints + buildQualityPoints + modPoints + engagementPoints;
  const rarityCalculated = Math.floor(baseScore * multiplier);
  const verificationBonus = car.isVerified ? 1500 : 0;

  return rarityCalculated + verificationBonus;
}

export function calculateTotalGarageReputation(cars: CarData[]): number {
  return cars.reduce((total, car) => total + (car.calculatedScore || calculateCarGR(car)), 0);
}

export function getGarageRank(totalGR: number) {
  const currentRankIndex = RANKS.findIndex(
    (rank) => totalGR >= rank.minGR && totalGR <= rank.maxGR
  );
  const currentRank = currentRankIndex !== -1 ? RANKS[currentRankIndex] : RANKS[0];
  const nextRank = currentRankIndex < RANKS.length - 1 ? RANKS[currentRankIndex + 1] : null;

  let progress = 100;
  let grNeededForNext = 0;

  if (nextRank) {
    const range = nextRank.minGR - currentRank.minGR;
    const progressInCurrentRange = totalGR - currentRank.minGR;
    progress = Math.min(100, Math.max(0, Math.floor((progressInCurrentRange / range) * 100)));
    grNeededForNext = nextRank.minGR - totalGR;
  }

  return {
    current: currentRank,
    next: nextRank,
    progress,
    grNeededForNext,
  };
}

export function evaluateBadges(profile: Omit<UserProfile, 'badges'>, cars: CarData[]): string[] {
  const earnedBadges: string[] = [];

  if (cars.length > 0) {
    earnedBadges.push('first_build');
  }

  if (cars.some((car) => car.modifications.length >= 5)) {
    earnedBadges.push('heavy_modder');
  }

  if (profile.garageReputation >= 10000) {
    earnedBadges.push('elite_tier');
  }

  if (cars.some((car) => car.isVerified)) {
    earnedBadges.push('verified_ride');
  }

  return earnedBadges;
}
