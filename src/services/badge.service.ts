import { BADGES } from '../constants/badges';
import { Deposit, User } from '../types';
import { calculateCurrentStreak } from '../utils/calculations';

export function checkAndAwardBadges(user: User, deposits: Deposit[]): string[] {
  const awarded: string[] = [];
  const depositCount = deposits.length;
  const streak = calculateCurrentStreak(deposits);

  for (const badge of BADGES) {
    const alreadyHas = user.badges.includes(badge.id);
    if (alreadyHas) {
      continue;
    }

    if (badge.requirement.type === 'weight' && user.totalWeight >= badge.requirement.threshold) {
      awarded.push(badge.id);
    }

    if (badge.requirement.type === 'deposits' && depositCount >= badge.requirement.threshold) {
      awarded.push(badge.id);
    }

    if (badge.requirement.type === 'streak' && streak >= badge.requirement.threshold) {
      awarded.push(badge.id);
    }
  }

  return awarded;
}
