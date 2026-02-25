import { mockCollectionPoints, mockDeposits, mockGlobalRanking, mockVillageRanking } from '../data/mockData';
import { CollectionPoint, Deposit, RankingItem, WasteType } from '../types';
import { calculatePoints } from '../utils/calculations';

interface CreateDepositInput {
  userId: string;
  wasteType: WasteType;
  weight: number;
  collectionPointId: string;
  image?: string;
}

let depositsStore: Deposit[] = [...mockDeposits];

export async function listDepositsByUser(userId: string): Promise<Deposit[]> {
  return depositsStore
    .filter((d) => d.userId === userId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function listAllDeposits(): Promise<Deposit[]> {
  return [...depositsStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function createDeposit(input: CreateDepositInput): Promise<Deposit> {
  const deposit: Deposit = {
    id: `dep_${Date.now()}`,
    userId: input.userId,
    wasteType: input.wasteType,
    weight: input.weight,
    points: calculatePoints(input.wasteType, input.weight),
    collectionPointId: input.collectionPointId,
    image: input.image,
    timestamp: new Date(),
    verified: false
  };

  depositsStore = [deposit, ...depositsStore];
  return deposit;
}

export async function listCollectionPoints(): Promise<CollectionPoint[]> {
  return mockCollectionPoints;
}

export async function getCollectionPointByQr(qrCode: string): Promise<CollectionPoint | undefined> {
  return mockCollectionPoints.find((cp) => cp.qrCode.toLowerCase() === qrCode.toLowerCase());
}

export async function getOrganizationRanking(organization: string): Promise<RankingItem[]> {
  return mockVillageRanking.filter((item) => item.organization === organization || item.userId === 'user_001');
}

export async function getGlobalRanking(): Promise<RankingItem[]> {
  return mockGlobalRanking;
}
