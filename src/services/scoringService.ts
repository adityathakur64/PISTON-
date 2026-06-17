import type { CarData } from './reputationService';
import type { UserProfile } from './reputationService';
import { calculateCarGR, evaluateBadges, getGarageRank } from './reputationService';

export function calculateGarageReputation(
  car: Omit<CarData, 'id' | 'createdAt' | 'calculatedScore' | 'garageScore'>
): number {
  return calculateCarGR(car);
}

export function calculateGarageStats(profile: UserProfile, cars: CarData[]) {
  const garageReputation = cars.reduce(
    (total, car) => total + (car.calculatedScore || calculateCarGR(car)),
    0
  );
  const rankInfo = getGarageRank(garageReputation);
  const updatedProfile = {
    ...profile,
    garageReputation,
    rank: rankInfo.current.title,
  };

  return {
    garageReputation,
    rank: rankInfo.current.title,
    badges: evaluateBadges(updatedProfile, cars),
  };
}

export function calculateLeaderboardBadges(users: UserProfile[]): UserProfile[] {
  return users.map((user, index) => {
    const badges = new Set(user.badges || []);

    if (index < 10) {
      badges.add('top_10');
    } else {
      badges.delete('top_10');
    }

    return {
      ...user,
      badges: Array.from(badges),
    };
  });
}

export { getGarageRank };
