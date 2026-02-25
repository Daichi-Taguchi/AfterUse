import { Badge } from '../types';

export const BADGES: Badge[] = [
  {
    id: 'first_deposit',
    name: 'First Deposit',
    description: 'Completed your first deposit.',
    icon: 'leaf',
    requirement: { type: 'deposits', threshold: 1 }
  },
  {
    id: 'eco_warrior',
    name: 'Eco Warrior',
    description: 'Reached 50kg total deposits.',
    icon: 'shield-check',
    requirement: { type: 'weight', threshold: 50 }
  },
  {
    id: 'consistent_contributor',
    name: 'Consistent Contributor',
    description: 'Deposited for 7 consecutive days.',
    icon: 'calendar-check',
    requirement: { type: 'streak', threshold: 7 }
  }
];
