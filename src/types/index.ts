export type WasteType = 'plastic' | 'paper' | 'metal' | 'glass' | 'mixed';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  organization: string;
  profileImage?: string;
  totalPoints: number;
  totalWeight: number;
  joinedAt: Date;
  badges: string[];
}

export interface Deposit {
  id: string;
  userId: string;
  wasteType: WasteType;
  weight: number;
  points: number;
  image?: string;
  collectionPointId: string;
  timestamp: Date;
  verified: boolean;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  village: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  qrCode: string;
  operatingHours: string;
  contactPerson: string;
}

export type BadgeRequirementType = 'weight' | 'deposits' | 'streak';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: BadgeRequirementType;
    threshold: number;
  };
}

export interface MonthlyStats {
  totalWeight: number;
  totalPoints: number;
  depositCount: number;
  totalCO2Reduction: number;
}

export interface RankingItem {
  userId: string;
  userName: string;
  organization: string;
  totalPoints: number;
  totalWeight: number;
  rank: number;
}
