import { Deposit, WasteType } from '../types';

export const POINTS_PER_KG: Record<WasteType, number> = {
  plastic: 10,
  paper: 5,
  metal: 15,
  glass: 8,
  mixed: 7
};

export const CO2_FACTOR: Record<WasteType, number> = {
  plastic: 3.0,
  paper: 1.5,
  metal: 2.5,
  glass: 0.5,
  mixed: 1.5
};

export function calculatePoints(wasteType: WasteType, weight: number): number {
  const rate = POINTS_PER_KG[wasteType] || 0;
  return Math.round(weight * rate);
}

export function calculateCO2Reduction(wasteType: WasteType, weight: number): number {
  return Number((weight * (CO2_FACTOR[wasteType] || 0)).toFixed(2));
}

export function calculateMonthlyStats(deposits: Deposit[]) {
  const now = new Date();
  const monthlyDeposits = deposits.filter((d) => {
    const date = new Date(d.timestamp);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });

  const totalWeight = monthlyDeposits.reduce((sum, d) => sum + d.weight, 0);
  const totalPoints = monthlyDeposits.reduce((sum, d) => sum + d.points, 0);
  const totalCO2Reduction = monthlyDeposits.reduce(
    (sum, d) => sum + calculateCO2Reduction(d.wasteType, d.weight),
    0
  );

  return {
    totalWeight: Number(totalWeight.toFixed(2)),
    totalPoints,
    depositCount: monthlyDeposits.length,
    totalCO2Reduction: Number(totalCO2Reduction.toFixed(2))
  };
}

export function calculateCurrentStreak(deposits: Deposit[]): number {
  const days = Array.from(
    new Set(
      deposits.map((d) => {
        const date = new Date(d.timestamp);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      })
    )
  )
    .map((key) => {
      const [year, month, date] = key.split('-').map(Number);
      return new Date(year, month, date);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  if (days.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = days[i - 1];
    const curr = days[i];
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}
