import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuthContext } from './AuthContext';
import {
  createDeposit,
  getCollectionPointByQr,
  getGlobalRanking,
  getOrganizationRanking,
  listCollectionPoints,
  listDepositsByUser
} from '../services/deposit.service';
import { checkAndAwardBadges } from '../services/badge.service';
import { applyDepositToUser } from '../services/points.service';
import { CollectionPoint, Deposit, RankingItem, WasteType } from '../types';

interface AppDataContextValue {
  deposits: Deposit[];
  collectionPoints: CollectionPoint[];
  organizationRanking: RankingItem[];
  globalRanking: RankingItem[];
  refresh: () => Promise<void>;
  addDeposit: (payload: {
    wasteType: WasteType;
    weight: number;
    collectionPointId: string;
    image?: string;
  }) => Promise<{ newBadgeIds: string[] }>;
  findPointByQr: (qrCode: string) => Promise<CollectionPoint | undefined>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user, updateCurrentUser } = useAuthContext();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [collectionPoints, setCollectionPoints] = useState<CollectionPoint[]>([]);
  const [organizationRanking, setOrganizationRanking] = useState<RankingItem[]>([]);
  const [globalRanking, setGlobalRanking] = useState<RankingItem[]>([]);

  const refresh = async () => {
    if (!user) {
      setDeposits([]);
      setCollectionPoints([]);
      setOrganizationRanking([]);
      setGlobalRanking([]);
      return;
    }

    const [depositData, pointsData, organizationData, globalData] = await Promise.all([
      listDepositsByUser(user.id),
      listCollectionPoints(),
      getOrganizationRanking(user.organization),
      getGlobalRanking()
    ]);

    setDeposits(depositData);
    setCollectionPoints(pointsData);
    setOrganizationRanking(organizationData);
    setGlobalRanking(globalData);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const addDeposit = async (payload: {
    wasteType: WasteType;
    weight: number;
    collectionPointId: string;
    image?: string;
  }) => {
    if (!user) {
      throw new Error('Login is required.');
    }

    const deposit = await createDeposit({ userId: user.id, ...payload });
    const nextDeposits = [deposit, ...deposits];
    setDeposits(nextDeposits);

    const updatedUser = applyDepositToUser(user, deposit);
    const newBadgeIds = checkAndAwardBadges(updatedUser, nextDeposits);
    updateCurrentUser({
      ...updatedUser,
      badges: Array.from(new Set([...updatedUser.badges, ...newBadgeIds]))
    });
    return { newBadgeIds };
  };

  const findPointByQr = async (qrCode: string) => getCollectionPointByQr(qrCode);

  const value = useMemo(
    () => ({
      deposits,
      collectionPoints,
      organizationRanking,
      globalRanking,
      refresh,
      addDeposit,
      findPointByQr
    }),
    [deposits, collectionPoints, organizationRanking, globalRanking]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppDataContext() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext must be used within AppDataProvider');
  }
  return context;
}
