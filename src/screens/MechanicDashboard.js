import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Switch,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

export default function MechanicDashboard() {
  const navigation = useNavigation();
  const [shopProfile, setShopProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  // Setup Form State
  const [setupName, setSetupName] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Dashboard Form State
  const [openTimeInput, setOpenTimeInput] = useState('');
  const [closeTimeInput, setCloseTimeInput] = useState('');
  const [minChargeInput, setMinChargeInput] = useState('');
  const [puncturePrice, setPuncturePrice] = useState('');
  const [generalServicePrice, setGeneralServicePrice] = useState('');
  const [oilChangeLabor, setOilChangeLabor] = useState('');
  const [engineWorkStartingPrice, setEngineWorkStartingPrice] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch Mechanic Profile based on authenticated user ID
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "mechanics"), where("owner_id", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0];
        const data = docRef.data();
        setShopProfile({ id: docRef.id, ...data });

        // Populate inputs with existing data
        setOpenTimeInput(data.openTime || data.open_time || '9:00 AM');
        setCloseTimeInput(data.closeTime || data.close_time || '9:00 PM');
        setMinChargeInput(data.minCharge ? data.minCharge.toString() : '');
        setPuncturePrice(data.puncturePrice ? data.puncturePrice.toString() : '');
        setGeneralServicePrice(data.generalServicePrice ? data.generalServicePrice.toString() : '');
        setOilChangeLabor(data.oilChangeLabor ? data.oilChangeLabor.toString() : '');
        setEngineWorkStartingPrice(data.engineWorkStartingPrice ? data.engineWorkStartingPrice.toString() : '');
        setIsOpen(data.isOpen || false);
      } else {
        setShopProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Header Configuration
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: shopProfile ? shopProfile.name : 'Mechanic Dashboard',
      headerStyle: { backgroundColor: '#1B3A57' },
      headerTintColor: '#fff',
      headerRight: () => (
        <TouchableOpacity onPress={() => auth.signOut()} style={{ marginRight: 15 }}>
          <Ionicons name="log-out-outline" size={28} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, shopProfile]);

  // Handle Setup Registration
  const handleSetupGarage = async () => {
    if (!setupName.trim() || !setupPhone.trim()) {
      Alert.alert("Error", "Please provide a Garage Name and Phone Number.");
      return;
    }

    setIsSettingUp(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "mechanics"), {
        name: setupName.trim(),
        phone: setupPhone.trim(),
        owner_id: user.uid,
        status: "approved", // Automatically approved for simplicity
        isOpen: false,
        openTime: "9:00 AM",
        closeTime: "6:00 PM"
      });
      Alert.alert("Success", "Your garage has been successfully set up!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to setup garage. Please try again.");
    } finally {
      setIsSettingUp(false);
    }
  };

  // Immediate Toggle Status
  const toggleShopStatus = async () => {
    if (!shopProfile) return;
    const newStatus = !isOpen;

    // Optimistic UI Update
    setIsOpen(newStatus);

    try {
      await updateDoc(doc(db, "mechanics", shopProfile.id), {
        isOpen: newStatus
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not toggle status.");
      setIsOpen(!newStatus); // Revert on failure
    }
  };

  // Batch Update Profile Details (Timings, Charge, Pricing)
  const handleUpdateProfile = async () => {
    if (!shopProfile) return;

    try {
      await updateDoc(doc(db, "mechanics", shopProfile.id), {
        openTime: openTimeInput,
        closeTime: closeTimeInput,
        minCharge: minChargeInput ? parseFloat(minChargeInput) : null,
        puncturePrice: puncturePrice ? parseFloat(puncturePrice) : null,
        generalServicePrice: generalServicePrice ? parseFloat(generalServicePrice) : null,
        oilChangeLabor: oilChangeLabor ? parseFloat(oilChangeLabor) : null,
        engineWorkStartingPrice: engineWorkStartingPrice ? parseFloat(engineWorkStartingPrice) : null,
      });
      Alert.alert("Success", "Shop profile updated successfully!");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not update shop details.");
    }
  };

  // Detect and Save Live Location
  const handleUpdateLocation = async () => {
    if (!shopProfile) return;

    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission is required to save your live location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const { latitude, longitude } = location.coords;

      await updateDoc(doc(db, 'mechanics', shopProfile.id), {
        latitude: latitude,
        longitude: longitude,
        lastLocationUpdate: new Date().toISOString(),
      });

      Alert.alert('Location Saved', 'Your garage location has been updated on the map successfully!');
    } catch (error) {
      console.error(error);
      Alert.alert('Location Error', 'Failed to retrieve your devices location.');
    } finally {
      setLocationLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1B3A57" />
        <Text style={{ marginTop: 10, color: '#1B3A57' }}>Loading Dashboard...</Text>
      </View>
    );
  }

  // --- VIEW 1: SETUP GARAGE (If no profile exists) ---
  if (!shopProfile) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Garage Setup</Text>
          <Text style={styles.cardSubtitle}>Register your shop to start receiving customers.</Text>

          <TextInput
            style={styles.input}
            placeholder="Shop Name"
            placeholderTextColor="#999"
            value={setupName}
            onChangeText={setSetupName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={setupPhone}
            onChangeText={setSetupPhone}
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSettingUp && styles.disabledButton]}
            onPress={handleSetupGarage}
            disabled={isSettingUp}
          >
            {isSettingUp ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- VIEW 2: FULL DASHBOARD ---
  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 30 }}>

      {/* 1. Shop Status Section */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardTitle}>Current Status</Text>
            <Text style={[styles.statusIndicator, { color: isOpen ? 'green' : 'red' }]}>
              {isOpen ? '🟢 OPEN FOR BUSINESS' : '🔴 CLOSED'}
            </Text>
          </View>
          <Switch
            value={isOpen}
            onValueChange={toggleShopStatus}
            trackColor={{ false: "#ccc", true: "#1B3A57" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 2. Business Details Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Business Hours & Pricing</Text>

        <View style={styles.row}>
          <View style={styles.flexItem}>
            <Text style={styles.inputLabel}>Opening Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 9:00 AM"
              placeholderTextColor="#999"
              value={openTimeInput}
              onChangeText={setOpenTimeInput}
            />
          </View>
          <View style={{ width: 15 }} />
          <View style={styles.flexItem}>
            <Text style={styles.inputLabel}>Closing Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 7:00 PM"
              placeholderTextColor="#999"
              value={closeTimeInput}
              onChangeText={setCloseTimeInput}
            />
          </View>
        </View>

        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Minimum Service Charge (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 150"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={minChargeInput}
          onChangeText={setMinChargeInput}
        />
      </View>

      {/* 3. Service Pricing Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Service Pricing (₹)</Text>
        <Text style={styles.cardSubtitle}>Provide estimated baseline prices for common services.</Text>

        <Text style={styles.inputLabel}>Puncture Repair Price</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 80"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={puncturePrice}
          onChangeText={setPuncturePrice}
        />

        <Text style={styles.inputLabel}>General Service Price</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 500"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={generalServicePrice}
          onChangeText={setGeneralServicePrice}
        />

        <Text style={styles.inputLabel}>Oil Change Labor</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 150"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={oilChangeLabor}
          onChangeText={setOilChangeLabor}
        />

        <Text style={styles.inputLabel}>Engine Work Starting Price</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1500"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={engineWorkStartingPrice}
          onChangeText={setEngineWorkStartingPrice}
        />
      </View>

      <TouchableOpacity style={[styles.primaryButton, { marginBottom: 15 }]} onPress={handleUpdateProfile}>
        <Text style={styles.buttonText}>Save / Update Profile</Text>
      </TouchableOpacity>

      {/* 4. Location Tracking Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Map Configuration</Text>
        <Text style={styles.cardSubtitle}>
          Ensure customers can find you! Tap below to update your live GPS coordinates onto the Map.
        </Text>

        <TouchableOpacity
          style={styles.locationButton}
          onPress={handleUpdateLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="#1B3A57" size="small" />
          ) : (
            <>
              <Ionicons name="location" size={20} color="#1B3A57" />
              <Text style={styles.locationButtonText}>📍 Detect & Update My Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    justifyContent: 'center',
    padding: 20
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8',
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B3A57',
    marginBottom: 5
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusIndicator: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  flexItem: {
    flex: 1
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15
  },
  primaryButton: {
    backgroundColor: '#1B3A57',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5
  },
  disabledButton: {
    backgroundColor: '#A0B0C0'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  locationButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#1B3A57',
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F0F8', // very light blue
    marginTop: 5
  },
  locationButtonText: {
    color: '#1B3A57',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8
  }
});
