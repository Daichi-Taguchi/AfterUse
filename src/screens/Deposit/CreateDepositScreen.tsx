import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import * as Location from 'expo-location';
import { Button, Card, Chip, Modal, Portal, Snackbar, Text, TextInput } from 'react-native-paper';
import { WasteTypeButton } from '../../components/WasteTypeButton';
import { CollectionPointMap } from '../../components/CollectionPointMap';
import { useDeposits } from '../../hooks/useDeposits';
import { WasteType } from '../../types';
import { calculatePoints } from '../../utils/calculations';
import { validateWasteType, validateWeight } from '../../utils/validators';

const wasteTypes: WasteType[] = ['plastic', 'paper', 'metal', 'glass', 'mixed'];
const DEFAULT_MAP_REGION = {
  latitude: -6.8915,
  longitude: 107.6107,
  latitudeDelta: 0.006,
  longitudeDelta: 0.006
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusKm * c;
}

function formatDistanceKm(distanceKm: number | null) {
  if (distanceKm == null) {
    return '-';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

export function CreateDepositScreen() {
  const { collectionPoints, addDeposit, findPointByQr } = useDeposits();
  const [collectionPointId, setCollectionPointId] = useState('');
  const [wasteType, setWasteType] = useState<WasteType | undefined>(undefined);
  const [weightText, setWeightText] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [qr, setQr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationStatusText, setLocationStatusText] = useState<string | null>(null);

  const weight = Number(weightText);
  const points = useMemo(() => (wasteType && weight ? calculatePoints(wasteType, weight) : 0), [wasteType, weight]);
  const selectedPoint = useMemo(
    () => collectionPoints.find((point) => point.id === collectionPointId),
    [collectionPoints, collectionPointId]
  );
  const pointsWithDistance = useMemo(() => {
    return collectionPoints
      .map((point) => ({
        point,
        distanceKm: userLocation ? calculateDistanceKm(userLocation, point.coordinates) : null
      }))
      .sort((a, b) => {
        if (a.distanceKm == null && b.distanceKm == null) {
          return a.point.name.localeCompare(b.point.name);
        }
        if (a.distanceKm == null) {
          return 1;
        }
        if (b.distanceKm == null) {
          return -1;
        }
        return a.distanceKm - b.distanceKm;
      });
  }, [collectionPoints, userLocation]);
  const nearestPoint = pointsWithDistance.find((item) => item.distanceKm != null)?.point;
  const webMapPoints = useMemo(() => {
    const coords = collectionPoints.map((point) => point.coordinates);
    const all = userLocation ? [...coords, userLocation] : coords;
    if (all.length === 0) {
      return null;
    }

    const latitudes = all.map((c) => c.latitude);
    const longitudes = all.map((c) => c.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    const latSpan = Math.max(0.0008, maxLat - minLat);
    const lngSpan = Math.max(0.0008, maxLng - minLng);
    const paddingRatio = 0.12;

    return {
      minLat: minLat - latSpan * paddingRatio,
      maxLat: maxLat + latSpan * paddingRatio,
      minLng: minLng - lngSpan * paddingRatio,
      maxLng: maxLng + lngSpan * paddingRatio
    };
  }, [collectionPoints, userLocation]);
  const mapRegion = useMemo(() => {
    if (selectedPoint) {
      return {
        latitude: selectedPoint.coordinates.latitude,
        longitude: selectedPoint.coordinates.longitude,
        latitudeDelta: DEFAULT_MAP_REGION.latitudeDelta,
        longitudeDelta: DEFAULT_MAP_REGION.longitudeDelta
      };
    }
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: DEFAULT_MAP_REGION.latitudeDelta,
        longitudeDelta: DEFAULT_MAP_REGION.longitudeDelta
      };
    }
    return DEFAULT_MAP_REGION;
  }, [selectedPoint, userLocation]);

  const resolveQrCode = async (rawQr: string) => {
    const qrCode = rawQr.trim();
    if (!qrCode) {
      setError('Please enter a QR code value.');
      return;
    }

    const point = await findPointByQr(qrCode);
    if (!point) {
      setError('No collection point was found for this QR code.');
      return;
    }

    setQr(qrCode);
    setCollectionPointId(point.id);
    setSuccess(`Collection point selected: ${point.name}`);
    setError(null);
  };

  const handleQrResolve = async () => {
    await resolveQrCode(qr);
  };

  const handleOpenScanner = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    const granted = status === 'granted';
    setCameraPermission(granted);

    if (!granted) {
      setError('Camera permission is required. Please enable it in your browser/device settings.');
      return;
    }

    setScanned(false);
    setScannerVisible(true);
  };

  const handleScanned = async (result: BarCodeScannerResult) => {
    if (scanned) {
      return;
    }

    setScanned(true);
    setScannerVisible(false);
    await resolveQrCode(result.data);
  };

  const handleUseCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationStatusText('Requesting location permission...');
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setError('Location permission is required to find the nearest collection point.');
        setLocationStatusText('Location permission denied');
        return;
      }

      setLocationStatusText('Getting current location...');
      let position: { coords: { latitude: number; longitude: number } } | null = null;
      try {
        position = await Location.getCurrentPositionAsync({
          accuracy: Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.High
        });
      } catch {
        position = null;
      }

      if (!position && Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        setLocationStatusText('Retrying via browser geolocation...');
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ coords: { latitude: p.coords.latitude, longitude: p.coords.longitude } }),
            (e) => reject(new Error(e.message || 'Browser geolocation failed.')),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
          );
        });
      }

      if (!position) {
        throw new Error('Failed to get current location.');
      }

      const nextLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      setUserLocation(nextLocation);
      setError(null);
      setLocationStatusText(`Location acquired (${nextLocation.latitude.toFixed(5)}, ${nextLocation.longitude.toFixed(5)})`);

      const nearest = collectionPoints
        .map((point) => ({
          point,
          distanceKm: calculateDistanceKm(nextLocation, point.coordinates)
        }))
        .sort((a, b) => a.distanceKm - b.distanceKm)[0];

      if (nearest) {
        setCollectionPointId(nearest.point.id);
        setSuccess(`Nearest point selected: ${nearest.point.name} (${formatDistanceKm(nearest.distanceKm)})`);
      }
    } catch (e) {
      setError((e as Error).message || 'Failed to get current location.');
      setLocationStatusText('Failed to get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async () => {
    const typeError = validateWasteType(wasteType);
    const weightError = validateWeight(weight);
    if (typeError || weightError) {
      setError(typeError || weightError);
      return;
    }
    if (!collectionPointId) {
      setError('Please select a collection point.');
      return;
    }

    try {
      const result = await addDeposit({
        wasteType: wasteType as WasteType,
        weight,
        collectionPointId,
        image
      });
      setSuccess(
        result.newBadgeIds.length
          ? `Deposit submitted. New badges: ${result.newBadgeIds.join(', ')}`
          : 'Deposit submitted successfully.'
      );
      setError(null);
      setWasteType(undefined);
      setWeightText('');
      setImage(undefined);
      setQr('');
      setCollectionPointId('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Step 1: Choose Nearest Collection Point (Map)" />
          <Card.Content>
            <Button
              mode="contained"
              icon="crosshairs-gps"
              onPress={handleUseCurrentLocation}
              style={styles.scanBtn}
              loading={locationLoading}
              disabled={locationLoading}
            >
              Use My Current Location
            </Button>

            <View style={styles.mapBox}>
              {Platform.OS !== 'web' ? (
                <CollectionPointMap
                  region={mapRegion}
                  userLocation={userLocation}
                  collectionPoints={collectionPoints}
                  selectedPointId={collectionPointId}
                  nearestPointId={nearestPoint?.id}
                  onSelectPoint={setCollectionPointId}
                />
              ) : webMapPoints ? (
                <View style={styles.webMap}>
                  <View style={styles.webMapGrid} />
                  {userLocation ? (
                    <View
                      style={[
                        styles.webMapDot,
                        styles.webMapUserDot,
                        getWebMapDotStyle(userLocation, webMapPoints)
                      ]}
                    />
                  ) : null}
                  {collectionPoints.map((point) => {
                    const isSelected = point.id === collectionPointId;
                    const isNearest = point.id === nearestPoint?.id;
                    return (
                      <Pressable
                        key={point.id}
                        style={[
                          styles.webMapDot,
                          getWebMapDotStyle(point.coordinates, webMapPoints),
                          isSelected
                            ? styles.webMapSelectedDot
                            : isNearest
                              ? styles.webMapNearestDot
                              : styles.webMapPointDot
                        ]}
                        onPress={() => setCollectionPointId(point.id)}
                      />
                    );
                  })}
                  <View style={styles.webMapLegend}>
                    <Text variant="bodySmall">Blue: You</Text>
                    <Text variant="bodySmall">Orange: Nearest</Text>
                    <Text variant="bodySmall">Green: Selected</Text>
                  </View>
                  <Text variant="bodySmall" style={styles.webMapCaption}>
                    ITB campus schematic map (tap dots to select a point)
                  </Text>
                </View>
              ) : (
                <View style={styles.mapFallback}>
                  <Text variant="titleSmall">Map preview is not available on this platform.</Text>
                  <Text variant="bodySmall" style={styles.hint}>
                    Use current location and select from the nearby list below (sorted by distance).
                  </Text>
                </View>
              )}

              <View style={styles.mapOverlayPanel}>
                {userLocation ? (
                  <View style={styles.locationSummary}>
                    <Chip icon="map-marker">Current location acquired</Chip>
                    {nearestPoint ? <Chip icon="star">Nearest: {nearestPoint.name}</Chip> : null}
                  </View>
                ) : (
                  <Text variant="bodySmall" style={styles.overlayHint}>
                    Tap "Use My Current Location" to auto-suggest the nearest ITB collection point.
                  </Text>
                )}
                {locationStatusText ? (
                  <Text variant="bodySmall" style={styles.overlayHint}>
                    {locationStatusText}
                  </Text>
                ) : null}
              </View>
            </View>

            <Text variant="titleSmall" style={styles.subTitle}>
              Nearby Collection Points (distance order)
            </Text>
            {pointsWithDistance.map(({ point, distanceKm }) => (
              <View key={point.id} style={styles.pointListItem}>
                <View style={styles.pointTextWrap}>
                  <Text variant="titleSmall">{point.name}</Text>
                  <Text variant="bodySmall">{point.address}</Text>
                  <Text variant="bodySmall">
                    Distance: {formatDistanceKm(distanceKm)} | Hours: {point.operatingHours}
                  </Text>
                </View>
                <Button
                  mode={collectionPointId === point.id ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setCollectionPointId(point.id)}
                >
                  {collectionPointId === point.id ? 'Selected' : 'Select'}
                </Button>
              </View>
            ))}

            {Platform.OS === 'web' ? (
              <Text variant="bodySmall" style={styles.hint}>
                On web, location and camera permissions depend on browser settings and HTTPS.
              </Text>
            ) : null}

            <Text variant="titleSmall" style={styles.subTitle}>
              QR / Manual Point Verification (optional fallback)
            </Text>

            <Button mode="outlined" icon="qrcode-scan" onPress={handleOpenScanner} style={styles.pointBtn}>
              Scan QR Code
            </Button>
            <TextInput
              label="QR code value (manual input allowed)"
              value={qr}
              onChangeText={setQr}
              style={styles.input}
            />
            <Button mode="outlined" onPress={handleQrResolve}>
              Verify QR
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Step 2: Enter Waste Information" />
          <Card.Content>
            <View style={styles.wasteGrid}>
              {wasteTypes.map((type) => (
                <WasteTypeButton
                  key={type}
                  type={type}
                  selected={wasteType === type}
                  onPress={() => setWasteType(type)}
                />
              ))}
            </View>

            <TextInput
              label="Weight (kg)"
              value={weightText}
              onChangeText={setWeightText}
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <TextInput
              label="Image URL (optional)"
              value={image || ''}
              onChangeText={setImage}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Step 3: Review" />
          <Card.Content>
            <Text>Collection point: {selectedPoint?.name || '-'}</Text>
            <Text>Waste type: {wasteType || '-'}</Text>
            <Text>Weight: {weightText || '-'} kg</Text>
            <Text>Estimated points: {points} pt</Text>
            <Button mode="contained" onPress={handleSubmit} style={styles.submit}>
              Submit
            </Button>
          </Card.Content>
        </Card>

        <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={3000}>
          {error}
        </Snackbar>
        <Snackbar visible={!!success} onDismiss={() => setSuccess(null)} duration={2500}>
          {success}
        </Snackbar>
      </ScrollView>

      <Portal>
        <Modal
          visible={scannerVisible}
          onDismiss={() => setScannerVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Align the QR code within the frame
          </Text>

          <View style={styles.scannerArea}>
            {cameraPermission ? (
              <BarCodeScanner
                style={StyleSheet.absoluteFillObject}
                barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
                onBarCodeScanned={scanned ? undefined : handleScanned}
              />
            ) : (
              <View style={styles.permissionBox}>
                <Text>Camera permission is not available</Text>
              </View>
            )}
          </View>

          <View style={styles.modalActions}>
            <Button onPress={() => setScannerVisible(false)}>Close</Button>
            <Button
              mode="outlined"
              onPress={() => {
                setScanned(false);
                setScannerVisible(true);
              }}
            >
              Scan Again
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32
  },
  card: {
    marginBottom: 12
  },
  scanBtn: {
    marginBottom: 10
  },
  input: {
    marginBottom: 10
  },
  hint: {
    marginTop: 8,
    color: '#616161'
  },
  locationSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 0
  },
  mapBox: {
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ECEFF1',
    marginBottom: 10,
    position: 'relative'
  },
  map: {
    flex: 1
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  mapOverlayPanel: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    padding: 10,
    gap: 6
  },
  overlayHint: {
    color: '#37474F'
  },
  webMap: {
    flex: 1,
    backgroundColor: '#EAF4EA',
    position: 'relative'
  },
  webMapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
    backgroundColor: '#DCEFD9'
  },
  webMapDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  webMapUserDot: {
    width: 18,
    height: 18,
    backgroundColor: '#1976D2'
  },
  webMapPointDot: {
    backgroundColor: '#E53935'
  },
  webMapNearestDot: {
    backgroundColor: '#FB8C00'
  },
  webMapSelectedDot: {
    backgroundColor: '#2E7D32'
  },
  webMapLegend: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 2
  },
  webMapCaption: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8
  },
  subTitle: {
    marginTop: 12,
    marginBottom: 8
  },
  pointListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F5F7F8'
  },
  pointTextWrap: {
    flex: 1
  },
  pointBtn: {
    marginBottom: 8
  },
  wasteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12
  },
  submit: {
    marginTop: 12
  },
  modalContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF'
  },
  modalTitle: {
    marginBottom: 12,
    fontWeight: '700'
  },
  scannerArea: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000'
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  }
});

function getWebMapDotStyle(
  coordinate: { latitude: number; longitude: number },
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
) {
  const xRatio = (coordinate.longitude - bounds.minLng) / Math.max(0.000001, bounds.maxLng - bounds.minLng);
  const yRatio = (coordinate.latitude - bounds.minLat) / Math.max(0.000001, bounds.maxLat - bounds.minLat);

  return {
    left: `${Math.min(95, Math.max(5, xRatio * 100))}%`,
    top: `${Math.min(95, Math.max(5, (1 - yRatio) * 100))}%`,
    transform: [{ translateX: -8 }, { translateY: -8 }]
  } as any;
}
