import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Platform, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import { collection, onSnapshot, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import * as Location from 'expo-location';

// Haversine formula – returns distance in km
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

const RADIUS_KM = 5;

export default function PartsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [allParts, setAllParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [garageBike, setGarageBike] = useState(null);
  const [garageNickname, setGarageNickname] = useState('');
  const [insuranceDaysLeft, setInsuranceDaysLeft] = useState(null);
  const [pollutionDaysLeft, setPollutionDaysLeft] = useState(null);
  const [noMatchWarning, setNoMatchWarning] = useState(false);
  const [nearbyShopNames, setNearbyShopNames] = useState(null); // null = not loaded yet

  // Custom loading state for navigating to shops
  const [navigatingShopId, setNavigatingShopId] = useState(null);
  const [isGarageFilterActive, setIsGarageFilterActive] = useState(true);

  const hasWarning = (insuranceDaysLeft !== null && insuranceDaysLeft <= 30) ||
                     (pollutionDaysLeft !== null && pollutionDaysLeft <= 30);

  const handleNotificationPress = useCallback(() => {
    let message = '';

    if (insuranceDaysLeft !== null) {
      message += `Insurance: Expires in ${insuranceDaysLeft >= 0 ? insuranceDaysLeft : 0} days ${insuranceDaysLeft <= 30 ? '⚠️' : '✅'}\n`;
    } else {
      message += `Insurance: Not Set\n`;
    }

    if (pollutionDaysLeft !== null) {
      message += `Pollution: Expires in ${pollutionDaysLeft >= 0 ? pollutionDaysLeft : 0} days ${pollutionDaysLeft <= 30 ? '⚠️' : '✅'}`;
    } else {
      message += `Pollution: Not Set`;
    }

    Alert.alert('Document Status', message);
  }, [insuranceDaysLeft, pollutionDaysLeft]);

  // 1. Setup Header
  useEffect(() => {
    if (navigation) {
      navigation.setOptions({
        title: "Parts Inventory",
        headerRight: () => (
          <TouchableOpacity onPress={handleNotificationPress} style={{ marginRight: 15, position: 'relative' }}>
            <Ionicons name="notifications" size={24} color={theme.headerText || 'white'} />
            {hasWarning && (
              <View style={{
                position: 'absolute', top: -2, right: -2, backgroundColor: 'red',
                width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: theme.primary || 'white'
              }} />
            )}
          </TouchableOpacity>
        )
      });
    }
  }, [navigation, theme, hasWarning, handleNotificationPress]);

  // 2. Fetch Parts
  useEffect(() => {
    const q = query(collection(db, "parts"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
      setAllParts(list);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 3. Fetch user location and find nearby shops (5km)
  useEffect(() => {
    const fetchNearbyShops = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setNearbyShopNames([]); // no location = no nearby filter, show empty
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;

        const mechanicsSnap = await getDocs(collection(db, 'mechanics'));
        const nearby = [];
        mechanicsSnap.docs.forEach(d => {
          const m = d.data();
          const lat = parseFloat(m.latitude);
          const lng = parseFloat(m.longitude);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            if (getDistanceKm(latitude, longitude, lat, lng) <= RADIUS_KM) {
              if (m.name) nearby.push(m.name.trim().toLowerCase());
            }
          }
        });
        setNearbyShopNames(nearby);
      } catch (e) {
        console.error('Error fetching nearby shops:', e);
        setNearbyShopNames([]); // fallback: show nothing rather than everything
      }
    };
    fetchNearbyShops();
  }, []);

  // 3. Fetch Garage Data from Firestore
  useFocusEffect(
    useCallback(() => {
      const calculateDaysLeft = (dateString) => {
        if (!dateString || dateString.length !== 10) return null;
        const [day, month, year] = dateString.split('/');
        const expDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(expDate)) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      };

      const fetchGarage = async () => {
        try {
          const user = auth.currentUser;
          if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              let parsedData = null;

              if (userData.myBikes && userData.activeBikeId) {
                parsedData = userData.myBikes.find(b => b.id === userData.activeBikeId);
              } else if (userData.garageData) {
                parsedData = userData.garageData;
              }

              if (parsedData) {
                setGarageBike(parsedData.model || null);
                setGarageNickname(parsedData.nickname || '');

                setInsuranceDaysLeft(calculateDaysLeft(parsedData.insuranceDate || parsedData.insuranceExpiry));
                setPollutionDaysLeft(calculateDaysLeft(parsedData.pollutionDate || parsedData.pollutionExpiry));
                return;
              }
            }
          }

          setGarageBike(null);
          setGarageNickname('');
          setInsuranceDaysLeft(null);
          setPollutionDaysLeft(null);
        } catch (error) {
          console.error("Error fetching garage data", error);
        }
      };

      // Need this to clear search state properly when screen focuses
      setSearch('');
      fetchGarage();
    }, [])
  );

  // 5. Unified Filter Logic (Nearby Shops + Garage + Search)
  useEffect(() => {
    if (loading || nearbyShopNames === null) return;

    let result = nearbyShopNames.length > 0
      ? allParts.filter(p => p.shop_name && nearbyShopNames.includes(p.shop_name.trim().toLowerCase()))
      : [];

    let localNoMatch = false;

    if (search) {
      // If we have a robust search query, evaluate globally against ALL items bypassing the garage filter
      const textData = search.trim().toLowerCase();
      result = result.filter(item => {
        const itemData = item.name ? item.name.trim().toLowerCase() : '';
        const modelData = item.bike_model ? item.bike_model.trim().toLowerCase() : '';
        return itemData.includes(textData) || modelData.includes(textData);
      });
    } else {
      // Apply Garage Filter only if there is no specific search query AND the filter is turned on
      if (isGarageFilterActive && garageBike) {
        const normalizedGarageBike = garageBike.trim().toLowerCase();
        const garageFiltered = result.filter(part => {
          if (!part.bike_model) return false;
          const normalizedPartModel = part.bike_model.trim().toLowerCase();
          return normalizedPartModel.includes(normalizedGarageBike) || normalizedGarageBike.includes(normalizedPartModel);
        });
        if (garageFiltered.length > 0) {
          result = garageFiltered;
        } else {
          localNoMatch = true;
        }
      }
    }

    setNoMatchWarning(localNoMatch);
    setFilteredParts(result);
  }, [allParts, garageBike, search, loading, nearbyShopNames, isGarageFilterActive]);

  const handleSearch = (text) => {
    setSearch(text);
  };

  const handleNavigateToShop = async (shopName) => {
    try {
      const mechanicsRef = collection(db, "mechanics");
      const q = query(mechanicsRef, where("name", "==", shopName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const mechanicDoc = querySnapshot.docs[0].data();
        const lat = mechanicDoc.latitude;
        const long = mechanicDoc.longitude;

        if (lat && long) {
          const url = Platform.select({
            ios: `maps:0,0?q=${lat},${long}`,
            android: `google.navigation:q=${lat},${long}`
          });
          Linking.openURL(url).catch(() => {
            fallbackToNameSearch(shopName);
          });
          return;
        }
      }
      fallbackToNameSearch(shopName);
    } catch (error) {
      console.error("Error finding shop:", error);
      fallbackToNameSearch(shopName);
    }
  };

  const fallbackToNameSearch = (shopName) => {
    const queryStr = encodeURIComponent(shopName);
    const url = Platform.select({
      ios: `maps:0,0?q=${queryStr}`,
      android: `geo:0,0?q=${queryStr}`
    });
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${queryStr}`);
    });
  };

  const handleOpenShopProfile = async (shopName, pId) => {
    try {
      setNavigatingShopId(pId);

      const mechanicsRef = collection(db, "mechanics");
      const q = query(mechanicsRef, where("name", "==", shopName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // We found the actual document, so we can navigate
        const mechanicDoc = querySnapshot.docs[0];
        const mechanicData = { id: mechanicDoc.id, ...mechanicDoc.data() };
        navigation.navigate('ShopProfile', { shopData: mechanicData });
      } else {
        Alert.alert("Shop Not Found", "We couldn't find the profile for this shop.");
      }
    } catch (error) {
      console.error("Error finding shop profile:", error);
      Alert.alert("Error", "There was an issue loading the shop profile.");
    } finally {
      setNavigatingShopId(null);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.card }]}>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.model, { color: theme.text }]}>{item.bike_model}</Text>

        <TouchableOpacity onPress={() => handleOpenShopProfile(item.shop_name, item.id)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={styles.shop}>🏪 {item.shop_name}</Text>
            {navigatingShopId === item.id && (
              <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 5, marginTop: 4 }} />
            )}
          </View>
        </TouchableOpacity>

        <Text style={[styles.stock, { color: item.in_stock ? 'green' : 'red' }]}>
          {item.in_stock ? 'In Stock' : 'Out of Stock'}
        </Text>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.price}>₹{item.price}</Text>
        <TouchableOpacity
          style={[styles.mapBtn, { backgroundColor: '#9E0310' }]}
          onPress={() => handleNavigateToShop(item.shop_name)}
        >
          <Ionicons name="location-sharp" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const GarageHeader = () => {
    if (!garageBike) return null;

    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e3f2fd', padding: 10, marginHorizontal: 15, marginBottom: 10, borderRadius: 8, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons name="bicycle" size={20} color="#007AFF" />
            <Text style={{ marginLeft: 10, color: '#007AFF', fontWeight: 'bold' }}>
              {isGarageFilterActive ? `Garage: ${garageNickname || garageBike}` : 'Showing All Vehicles'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsGarageFilterActive(!isGarageFilterActive)}
            style={{ backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>
              {isGarageFilterActive ? 'Show All Vehicles' : 'Filter by My Garage'}
            </Text>
          </TouchableOpacity>
        </View>
        {noMatchWarning && isGarageFilterActive && !search && (
          <Text style={{ marginHorizontal: 15, marginBottom: 10, color: '#d32f2f', fontSize: 14, fontWeight: 'bold' }}>
            No parts found for {garageNickname || garageBike}. Showing all parts instead.
          </Text>
        )}
      </View>
    );
  };

  if (loading || nearbyShopNames === null) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color={theme.text} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholderTextColor="gray"
          placeholder="Search Parts..."
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>

      {/* 5km radius banner */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginBottom: 6 }}>
        <Ionicons name="location" size={14} color="#9E0310" />
        <Text style={{ marginLeft: 4, fontSize: 12, color: '#9E0310', fontWeight: '600' }}>
          Showing parts from shops within {RADIUS_KM} km
        </Text>
      </View>

      <GarageHeader />

      {nearbyShopNames.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="location-outline" size={52} color={theme.text} />
          <Text style={{ fontSize: 16, color: theme.text, marginTop: 12, textAlign: 'center', fontWeight: 'bold' }}>
            No shops found within {RADIUS_KM} km
          </Text>
          <Text style={{ fontSize: 14, color: 'gray', marginTop: 6, textAlign: 'center' }}>
            There are no registered mechanics near your current location.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredParts}
          keyExtractor={(item) => item.id}
          initialNumToRender={10}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, margin: 15, borderRadius: 10, elevation: 2, alignItems: 'center' },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 16, color: '#000' },
  card: { flexDirection: 'row', padding: 10, marginHorizontal: 15, marginBottom: 10, backgroundColor: 'white', borderRadius: 10, elevation: 3 },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  model: { fontSize: 12, color: '#666' },
  shop: { color: '#007AFF', fontWeight: 'bold', fontSize: 14, marginTop: 4, flexShrink: 1, flexWrap: 'wrap' },
  stock: { fontSize: 12, marginTop: 2, fontWeight: 'bold' },
  priceContainer: { alignItems: 'flex-end', justifyContent: 'space-between' },
  price: { fontSize: 18, fontWeight: 'bold', color: 'green' },
  mapBtn: { backgroundColor: '#007AFF', borderRadius: 50, padding: 8, marginTop: 10 },
});