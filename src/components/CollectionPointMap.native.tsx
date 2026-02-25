import React from 'react';
import MapView, { Marker } from 'react-native-maps';
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

export function CollectionPointMap({
  region,
  userLocation,
  collectionPoints,
  selectedPointId,
  nearestPointId,
  onSelectPoint
}: Props) {
  return (
    <MapView style={{ flex: 1 }} initialRegion={region} region={region}>
      {userLocation ? (
        <Marker coordinate={userLocation} title="Your Location" pinColor="#1976D2" />
      ) : null}
      {collectionPoints.map((point) => (
        <Marker
          key={point.id}
          coordinate={point.coordinates}
          title={point.name}
          description={point.address}
          pinColor={
            point.id === selectedPointId ? '#2E7D32' : point.id === nearestPointId ? '#FB8C00' : '#E53935'
          }
          onPress={() => onSelectPoint(point.id)}
        />
      ))}
    </MapView>
  );
}
