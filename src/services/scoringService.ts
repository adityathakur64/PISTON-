import type { CarData } from './reputationService';
import { calculateCarGR, getGarageRank } from './reputationService';

export function calculateGarageReputation(
  car: Omit<CarData, 'id' | 'createdAt' | 'calculatedScore' | 'garageScore'>
): number {
  return calculateCarGR(car);
}

export { getGarageRank };
