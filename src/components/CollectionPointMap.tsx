import React from 'react';
import { CollectionPoint } from '../types';

type Coordinate = { latitude: number; longitude: number };

interface Props {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation: Coordinate | null;
  collectionPoints: CollectionPoint[];
  selectedPointId: string;
  nearestPointId?: string;
  onSelectPoint: (pointId: string) => void;
}

export function CollectionPointMap(_: Props) {
  return null;
}
