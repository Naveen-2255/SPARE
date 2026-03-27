import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function SOSScreen() {
  const [loading, setLoading] = useState(false);

  // Haversine Formula to calculate distance (in km)
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleSmartSOS = async () => {
    setLoading(true);
    try {
      // 1. Get User Location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for SOS.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const userLat = location.coords.latitude;
      const userLong = location.coords.longitude;

      // 2. Fetch Mechanics
      const querySnapshot = await getDocs(collection(db, "mechanics"));
      let closestMechanic = null;
      let minDistance = Infinity;

      // 3. Find Nearest Mechanic (within reasonable distance)
      querySnapshot.forEach((doc) => {
        const mech = doc.data();
        const dist = getDistanceFromLatLonInKm(userLat, userLong, mech.latitude, mech.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestMechanic = { ...mech, distance: dist };
        }
      });

      // 4. Decide action based on nearest mechanic
      if (closestMechanic && minDistance < 50) {
        // Send SMS to nearest mechanic with location
        const message = `SOS! I am stranded. My location is: https://maps.google.com/?q=${userLat},${userLong}`;
        const phoneNumber = closestMechanic.phone.replace(/\D/g, ''); // Remove non-digit characters
        const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;

        try {
          await Linking.openURL(smsUrl);
          Alert.alert('SOS Sent', `Emergency message sent to nearest mechanic (${minDistance.toFixed(1)} km away)`);
        } catch (err) {
          // Fallback to phone call
          const telUrl = `tel:${phoneNumber}`;
          await Linking.openURL(telUrl);
        }
      } else {
        // Fallback: No mechanic near or database empty - Call emergency (100)
        Alert.alert(
          'Emergency Mode',
          'No nearby mechanic found. Calling emergency services (100).',
          [
            {
              text: 'Cancel',
              onPress: () => setLoading(false),
              style: 'cancel'
            },
            {
              text: 'Call 100',
              onPress: async () => {
                try {
                  const telUrl = `tel:100`;
                  await Linking.openURL(telUrl);
                } catch (err) {
                  Alert.alert('Error', 'Could not initiate call');
                }
                setLoading(false);
              },
              style: 'destructive'
            }
          ]
        );
      }

    } catch (error) {
      Alert.alert('Error', error.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={40} color="#FF5252" />
        <Text style={styles.headerTitle}>Emergency SOS</Text>
      </View>

      <View style={styles.circle}>
        <TouchableOpacity style={styles.button} onPress={handleSmartSOS} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <>
              <Text style={styles.text}>SOS</Text>
              <Text style={styles.subtext}>FIND HELP</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>📍 Detects your location</Text>
        <Text style={styles.infoText}>🔍 Finds nearest mechanic</Text>
        <Text style={styles.infoText}>📱 Sends emergency SMS with coordinates</Text>
        <Text style={styles.infoText}>☎️ Falls back to 100 if no mechanic nearby</Text>
      </View>

      <Text style={styles.note}>⚠️ Use only in genuine emergencies</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A2540',
    paddingHorizontal: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5252',
    marginTop: 10,
  },
  circle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  button: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 50,
    fontWeight: 'bold',
    color: 'white'
  },
  subtext: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 10,
    fontSize: 14,
  },
  infoContainer: {
    marginTop: 40,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF5252',
    maxWidth: '100%',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00A3E0',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 6,
    lineHeight: 18,
  },
  note: {
    marginTop: 30,
    color: '#FF5252',
    fontSize: 14,
    fontWeight: '600',
  }
});