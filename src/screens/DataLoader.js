import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

import REAL_SHOPS from '../data/real_shops.json';

export default function DataLoader() {
  const [log, setLog] = useState("Ready to Upload...");
  const [loading, setLoading] = useState(false);

  const startUpload = async () => {
    setLoading(true);
    setLog("Starting Upload Process...");

    try {
      // 1. (REMOVED) Upload Shops to 'mechanics' collection
      // const shops = DATA_FILE.shops;
      let shopCount = 0;
      /*
      for (const shop of shops) {
        await addDoc(collection(db, "mechanics"), shop);
        shopCount++;
      }
      */
      setLog(prev => prev + `\n✅ Uploaded ${shopCount} Shops (Disabled due to file size).`);

      // 2. (REMOVED) Upload Parts to 'parts' collection
      // const parts = DATA_FILE.spare_parts || [];
      let partCount = 0;
      /*
      for (const part of parts) {
        await addDoc(collection(db, "parts"), part);
        partCount++;
      }
      */
      setLog(prev => prev + `\n✅ Uploaded ${partCount} Parts (Disabled due to file size).`);

      Alert.alert("Success!", "Database population complete.");

    } catch (error) {
      console.error(error);
      setLog(prev => prev + `\n❌ Error: ${error.message}`);
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  const startRealShopsUpload = async () => {
    setLoading(true);
    setLog("Starting Real Shops Upload Process...");

    try {
      const shops = REAL_SHOPS;
      let shopCount = 0;
      for (const shop of shops) {
        const shopData = {
          ...shop,
          latitude: Number(shop.latitude),
          longitude: Number(shop.longitude)
        };
        await addDoc(collection(db, "mechanics"), shopData);
        shopCount++;
      }
      setLog(prev => prev + `\n✅ Uploaded ${shopCount} Real Shops.`);
      Alert.alert("Success!", "Real Shops population complete.");
    } catch (error) {
      console.error(error);
      setLog(prev => prev + `\n❌ Error: ${error.message}`);
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Database Loader</Text>

      <View style={styles.infoBox}>
        <Text>Real Shops in file: {REAL_SHOPS?.length || 0}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00A3E0" />
      ) : (
        <View style={{ gap: 10 }}>
          <Button title="UPLOAD DATA TO FIREBASE" onPress={startUpload} />
          <Button title="UPLOAD REAL SHOPS" onPress={startRealShopsUpload} color="#28a745" />
        </View>
      )}

      <ScrollView style={styles.logBox}>
        <Text style={styles.logText}>{log}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F4F6F8' },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  infoBox: { marginBottom: 20, alignItems: 'center' },
  logBox: { marginTop: 20, height: 200, backgroundColor: '#f0f0f0', padding: 10, borderRadius: 5 },
  logText: { fontSize: 14, fontFamily: 'monospace' }
});