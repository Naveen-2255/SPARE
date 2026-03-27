import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const RegisterShopScreen = ({ navigation }) => {
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setLocationError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission not granted');
        Alert.alert(
          'Permission Required',
          'Location permission is required to detect the shop location.'
        );
        setDetectingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      // Ensure numbers (not strings)
      setLocation({
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
      });
    } catch (error) {
      console.error('Error detecting location:', error);
      setLocationError('Unable to detect location. Please try again.');
      Alert.alert('Error', 'Unable to detect location. Please try again.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleRegisterShop = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please detect the shop location first.');
      return;
    }

    try {
      const mechanicsRef = collection(db, 'mechanics');
      await addDoc(mechanicsRef, {
        name: shopName || 'Unnamed Shop',
        phone: phoneNumber || '',
        address: address || '',
        owner_name: ownerName || '',
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
      });

      Alert.alert('Success', 'Shop Registered!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Parts'),
        },
      ]);
    } catch (error) {
      console.error('Error registering shop:', error);
      Alert.alert('Error', 'Unable to register shop. Please try again.');
    }
  };

  const isRegisterDisabled = !location || detectingLocation;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Register Shop</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter shop name"
            value={shopName}
            onChangeText={setShopName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Owner Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter owner name"
            value={ownerName}
            onChangeText={setOwnerName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter address"
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        <View style={styles.locationSection}>
          <TouchableOpacity
            style={styles.detectButton}
            onPress={handleDetectLocation}
            disabled={detectingLocation}
            activeOpacity={0.8}
          >
            {detectingLocation ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.detectButtonText}>📍 Detect Shop Location</Text>
            )}
          </TouchableOpacity>

          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationText}>
                Lat: {location.latitude.toFixed(4)}, Long:{' '}
                {location.longitude.toFixed(4)}
              </Text>
              <Text style={styles.checkmark}>✅</Text>
            </View>
          )}

          {locationError && !location && (
            <Text style={styles.errorText}>{locationError}</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.registerButton, isRegisterDisabled && styles.buttonDisabled]}
          onPress={handleRegisterShop}
          disabled={isRegisterDisabled}
          activeOpacity={0.8}
        >
          <Text style={styles.registerButtonText}>Register Shop</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  locationSection: {
    marginTop: 10,
  },
  detectButton: {
    backgroundColor: '#00A3E0',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationInfo: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  checkmark: {
    fontSize: 18,
    marginLeft: 8,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#F44336',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#FFFFFF',
  },
  registerButton: {
    backgroundColor: '#0A2540',
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterShopScreen;

