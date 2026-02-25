import { CollectionPoint, Deposit, RankingItem, User } from '../types';
import { calculatePoints } from '../utils/calculations';

export const mockCollectionPoints: CollectionPoint[] = [
  {
    id: 'cp_001',
    name: 'ITB GKU Timur Drop Point',
    address: 'ITB Kampus Ganesha, near GKU Timur',
    village: 'ITB Ganesha',
    coordinates: { latitude: -6.8915, longitude: 107.6107 },
    qrCode: 'CP001',
    operatingHours: '08:00 - 18:00',
    contactPerson: 'AfterUse ITB Team'
  },
  {
    id: 'cp_002',
    name: 'ITB CRCS / Labtek Area Drop Point',
    address: 'ITB Kampus Ganesha, CRCS / Labtek area',
    village: 'ITB Ganesha',
    coordinates: { latitude: -6.8899, longitude: 107.6101 },
    qrCode: 'CP002',
    operatingHours: '08:00 - 17:00',
    contactPerson: 'AfterUse ITB Team'
  },
  {
    id: 'cp_003',
    name: 'ITB Campus Center West Parking Drop Point',
    address: 'ITB Kampus Ganesha, west side parking area',
    village: 'ITB Ganesha',
    coordinates: { latitude: -6.8923, longitude: 107.6089 },
    qrCode: 'CP003',
    operatingHours: '08:00 - 18:00',
    contactPerson: 'AfterUse ITB Team'
  },
  {
    id: 'cp_004',
    name: 'ITB Student Center / Saraga Access Drop Point',
    address: 'ITB Kampus Ganesha, Student Center / Saraga access',
    village: 'ITB Ganesha',
    coordinates: { latitude: -6.8908, longitude: 107.6078 },
    qrCode: 'CP004',
    operatingHours: '07:00 - 19:00',
    contactPerson: 'AfterUse ITB Team'
  }
];

export const mockUser: User = {
  id: 'user_001',
  role: 'user',
  name: 'Ayu Lestari',
  phone: '+6281234567890',
  email: 'ayu@example.com',
  organization: 'ITB',
  totalPoints: 245,
  totalWeight: 24.8,
  joinedAt: new Date('2025-11-01T09:00:00.000Z'),
  badges: ['first_deposit']
};

export const mockAdminUser: User = {
  id: 'admin_001',
  role: 'admin',
  name: 'AfterUse Admin',
  phone: '+6281111111111',
  email: 'admin@afteruse.local',
  organization: 'AfterUse Operations',
  totalPoints: 0,
  totalWeight: 0,
  joinedAt: new Date('2025-10-15T09:00:00.000Z'),
  badges: []
};

const now = Date.now();

export const mockDeposits: Deposit[] = [
  {
    id: 'dep_001',
    userId: 'user_001',
    wasteType: 'plastic',
    weight: 3.2,
    points: calculatePoints('plastic', 3.2),
    collectionPointId: 'cp_001',
    timestamp: new Date(now - 1000 * 60 * 60 * 24 * 1),
    verified: true
  },
  {
    id: 'dep_002',
    userId: 'user_001',
    wasteType: 'metal',
    weight: 1.5,
    points: calculatePoints('metal', 1.5),
    collectionPointId: 'cp_002',
    timestamp: new Date(now - 1000 * 60 * 60 * 24 * 3),
    verified: true
  },
  {
    id: 'dep_003',
    userId: 'user_001',
    wasteType: 'paper',
    weight: 4.6,
    points: calculatePoints('paper', 4.6),
    collectionPointId: 'cp_001',
    timestamp: new Date(now - 1000 * 60 * 60 * 24 * 5),
    verified: false
  }
];

export const mockVillageRanking: RankingItem[] = [
  { userId: 'u1', userName: 'R***a', organization: 'ITB', totalPoints: 320, totalWeight: 31.4, rank: 1 },
  { userId: 'user_001', userName: 'Ayu Lestari', organization: 'ITB', totalPoints: 245, totalWeight: 24.8, rank: 2 },
  { userId: 'u3', userName: 'D***i', organization: 'ITB', totalPoints: 190, totalWeight: 20.2, rank: 3 }
];

export const mockGlobalRanking: RankingItem[] = [
  { userId: 'g1', userName: 'S***o', organization: 'SIT', totalPoints: 540, totalWeight: 48.1, rank: 1 },
  { userId: 'g2', userName: 'M***a', organization: 'CamEd', totalPoints: 430, totalWeight: 42.7, rank: 2 },
  { userId: 'user_001', userName: 'Ayu Lestari', organization: 'ITB', totalPoints: 245, totalWeight: 24.8, rank: 8 }
];
