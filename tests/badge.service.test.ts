import { checkAndAwardBadges } from '../src/services/badge.service';
import { Deposit, User } from '../src/types';

const user: User = {
  id: 'u1',
  role: 'user',
  name: 'Test',
  phone: '+62000000000',
  organization: 'ITB Ganesha',
  totalPoints: 100,
  totalWeight: 60,
  joinedAt: new Date('2025-01-01T00:00:00.000Z'),
  badges: []
};

const deposits: Deposit[] = [
  {
    id: 'd1',
    userId: 'u1',
    wasteType: 'plastic',
    weight: 10,
    points: 100,
    collectionPointId: 'cp1',
    timestamp: new Date(),
    verified: true
  }
];

describe('checkAndAwardBadges', () => {
  it('awards first and weight badges', () => {
    const result = checkAndAwardBadges(user, deposits);
    expect(result).toContain('first_deposit');
    expect(result).toContain('eco_warrior');
  });
});
