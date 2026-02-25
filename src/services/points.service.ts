import { Deposit, User } from '../types';
import { calculateCO2Reduction, calculateMonthlyStats } from '../utils/calculations';

export function calculateUserTotals(deposits: Deposit[]) {
  const totalWeight = deposits.reduce((sum, d) => sum + d.weight, 0);
  const totalPoints = deposits.reduce((sum, d) => sum + d.points, 0);
  const totalCO2 = deposits.reduce((sum, d) => sum + calculateCO2Reduction(d.wasteType, d.weight), 0);

  return {
    totalWeight: Number(totalWeight.toFixed(2)),
    totalPoints,
    totalCO2: Number(totalCO2.toFixed(2))
  };
}

export function monthlySummary(deposits: Deposit[]) {
  return calculateMonthlyStats(deposits);
}

export function applyDepositToUser(user: User, deposit: Deposit): User {
  return {
    ...user,
    totalPoints: user.totalPoints + deposit.points,
    totalWeight: Number((user.totalWeight + deposit.weight).toFixed(2))
  };
}
