import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert, TouchableOpacity, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

// Haversine formula – returns distance in km between two lat/lng points
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RADIUS_KM = 10;

export default function MapScreen({ route, navigation }) {
  const [mechanics, setMechanics] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const mapRef = useRef(null);
  const locationSubRef = useRef(null);

  useEffect(() => {
    requestLocationPermissionAndStartTracking();
    fetchMechanics();
    return () => {
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, []);

  const requestLocationPermissionAndStartTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your location on the map.'
        );
        setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
        setLoading(false);
        return;
      }

      locationSubRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (loc) => {
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
      setLoading(false);
    }
  };

  const fetchMechanics = async () => {
    try {
      const mechanicsSnapshot = await getDocs(collection(db, 'mechanics'));
      const mechanicsList = mechanicsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMechanics(mechanicsList);
    } catch (error) {
      console.error('Error fetching mechanics:', error);
    }
  };

  const openDirections = (lat, lng, label) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const url = Platform.select({
      ios: `${scheme}${encodeURIComponent(label)}@${latLng}`,
      android: `google.navigation:q=${latLng}`
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };

  if (loading || !userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A3E0" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  const validMechanics = mechanics.filter(m => {
    const lat = parseFloat(m.latitude);
    const lng = parseFloat(m.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    return getDistanceKm(userLocation.latitude, userLocation.longitude, lat, lng) <= RADIUS_KM;
  });

  const displayMechanics = validMechanics.length > 0
    ? validMechanics
    : mechanics.filter(m => Number.isFinite(parseFloat(m.latitude)) && Number.isFinite(parseFloat(m.longitude)));

  return (
    <View style={styles.container}>
      <View style={styles.radiusBanner}>
        <Ionicons name="location" size={14} color="#00A3E0" />
        <Text style={styles.radiusBannerText}>
          {displayMechanics.length} shop{displayMechanics.length !== 1 ? 's' : ''} shown
          {validMechanics.length > 0 ? ` within ${RADIUS_KM} km` : ' (all locations)'}
        </Text>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {displayMechanics.map(shop => (
          <Marker
            key={shop.id}
            coordinate={{ latitude: parseFloat(shop.latitude), longitude: parseFloat(shop.longitude) }}
            title={shop.name || 'Mechanic Shop'}
            onPress={() => setSelectedMechanic(shop)}
          >
            <View style={styles.customShopMarker}>
              <Ionicons name="construct" size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {selectedMechanic && (
        <View style={styles.bottomCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMechanic(null)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.cardShopName}>{selectedMechanic.name}</Text>
          {selectedMechanic.phone && <Text style={styles.cardShopPhone}>📞 {selectedMechanic.phone}</Text>}
          {selectedMechanic.address && <Text style={styles.cardShopAddress}>{selectedMechanic.address}</Text>}

          <View style={styles.cardButtonsRow}>
            <TouchableOpacity style={styles.cardProfileBtn} onPress={() => navigation.navigate('ShopProfile', { shopData: selectedMechanic })}>
              <Ionicons name="person" size={18} color="white" />
              <Text style={styles.cardBtnText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cardNavigateBtn} onPress={() => openDirections(parseFloat(selectedMechanic.latitude), parseFloat(selectedMechanic.longitude), selectedMechanic.name)}>
              <Ionicons name="navigate" size={18} color="white" />
              <Text style={styles.cardBtnText}>Navigate ➡️</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          if (userLocation && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }, 500);
          }
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F8' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  bottomCard: { position: 'absolute', bottom: 20, width: '90%', alignSelf: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 5, zIndex: 1000 },
  closeBtn: { position: 'absolute', top: 10, right: 10, padding: 5, zIndex: 10 },
  cardShopName: { fontSize: 20, fontWeight: 'bold', color: '#0A2540', marginBottom: 4, paddingRight: 30 },
  cardShopPhone: { fontSize: 15, color: '#444', marginBottom: 2 },
  cardShopAddress: { fontSize: 14, color: '#666', marginBottom: 10 },
  cardButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cardProfileBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  cardNavigateBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#00A3E0', paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
  cardBtnText: { color: 'white', fontSize: 15, fontWeight: '600', marginLeft: 6 },
  fab: { position: 'absolute', bottom: 150, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#00A3E0', justifyContent: 'center', alignItems: 'center', elevation: 10, zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  radiusBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 12, paddingVertical: 6, position: 'absolute', top: 10, alignSelf: 'center', zIndex: 999, borderRadius: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 },
  radiusBannerText: { marginLeft: 5, fontSize: 13, color: '#0A2540', fontWeight: '600' },
  customShopMarker: { backgroundColor: '#FF5252', padding: 5, borderRadius: 15, borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 4 }
});
