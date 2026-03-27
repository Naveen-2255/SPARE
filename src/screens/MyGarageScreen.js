import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const BIKE_DATABASE = [
  {
    brand: "Royal Enfield",
    models: ["Classic 350", "Bullet 350", "Hunter 350", "Meteor 350", "Himalayan 411", "Himalayan 450", "Interceptor 650", "Continental GT 650", "Super Meteor 650", "Shotgun 650"]
  },
  {
    brand: "Hero MotoCorp",
    models: ["Splendor Plus", "HF Deluxe", "Passion Plus", "Glamour", "Super Splendor", "Xpulse 200 4V", "Xpulse 200T", "Karizma XMR", "Xtreme 125R", "Xtreme 160R", "Xtreme 200S", "Pleasure Plus", "Destini 125"]
  },
  {
    brand: "Honda",
    models: ["Activa 6G", "Activa 125", "Dio", "Shine 100", "Shine 125", "SP 125", "Unicorn", "Hornet 2.0", "CB200X", "H'ness CB350", "CB350RS", "CB300F", "CB300R", "CB300F Flex-Fuel"]
  },
  {
    brand: "Bajaj",
    models: ["Pulsar 125", "Pulsar 150", "Pulsar N150", "Pulsar N160", "Pulsar NS200", "Pulsar NS400Z", "Dominar 250", "Dominar 400", "Avenger 160", "Avenger 220", "Platina 100", "Platina 110", "CT 110X", "Chetak"]
  },
  {
    brand: "TVS",
    models: ["Apache RTR 160", "Apache RTR 160 4V", "Apache RTR 180", "Apache RTR 200 4V", "Apache RR 310", "Raider 125", "Radeon", "Sport", "Jupiter", "Ntorq 125", "iQube"]
  },
  {
    brand: "Yamaha",
    models: ["R15 V4", "MT-15 V2", "FZ-S V4", "FZ-X", "FZ-FI", "Aerox 155", "RayZR 125", "Fascino 125"]
  },
  {
    brand: "KTM",
    models: ["Duke 125", "Duke 200", "Duke 250", "Duke 390", "RC 125", "RC 200", "RC 390", "Adventure 250", "Adventure 390"]
  },
  {
    brand: "Suzuki",
    models: ["Access 125", "Burgman Street 125", "Avenis 125", "Gixxer", "Gixxer SF", "Gixxer 250", "Gixxer SF 250", "V-Strom SX"]
  },
  {
    brand: "Kawasaki",
    models: ["Ninja 300", "Ninja 400", "Ninja 500", "Ninja ZX-4R", "Ninja ZX-6R", "Ninja ZX-10R", "Z650", "Z900", "Versys 650"]
  },
  {
    brand: "BMW Motorrad",
    models: ["G 310 R", "G 310 GS", "F 900 R", "F 900 GS", "S 1000 RR", "R 1250 GS"]
  },
  {
    brand: "Triumph",
    models: ["Speed 400", "Scrambler 400 X", "Street Triple RS", "Tiger Sport 660", "Tiger 900", "Rocket 3"]
  },
  {
    brand: "Harley-Davidson",
    models: ["X440", "Nightster", "Sportster S", "Fat Bob 114", "Street Glide"]
  }
];

export default function MyGarageScreen({ navigation }) {
  const { theme } = useTheme();
  const [selectedBrand, setSelectedBrand] = useState(null);

  // Data for saved bike Details
  const [myBikes, setMyBikes] = useState([]);
  const [activeBikeId, setActiveBikeId] = useState(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [tempModel, setTempModel] = useState('');

  // Form State
  const [nickname, setNickname] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [pollutionExpiry, setPollutionExpiry] = useState('');
  
  // Track if we are editing an existing bike
  const [editingBikeId, setEditingBikeId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    loadSavedBike();
  }, []);

  const loadSavedBike = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.myBikes) {
            setMyBikes(data.myBikes);
            setActiveBikeId(data.activeBikeId || (data.myBikes[0]?.id));
          } else if (data.garageData) {
            // Auto-migrate old single garageData to myBikes
            const migratedBike = { ...data.garageData, id: Date.now().toString() };
            setMyBikes([migratedBike]);
            setActiveBikeId(migratedBike.id);
            await setDoc(userDocRef, { myBikes: [migratedBike], activeBikeId: migratedBike.id, garageData: null }, { merge: true });
          }
        }
      }
    } catch (e) {
      console.error('Error loading bikes:', e);
    }
  };

  const handleDateInput = (text, setter) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);

    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length > 4) {
      formatted = formatted.substring(0, 5) + '/' + cleaned.substring(4);
    }
    setter(formatted);
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
  };

  const handleModelSelect = (model) => {
    setTempModel(`${selectedBrand} ${model}`);
    setNickname('');
    setInsuranceExpiry('');
    setPollutionExpiry('');
    setEditingBikeId(null);
    setModalVisible(true);
  };

  const handleEditBike = (bike) => {
    setTempModel(bike.model);
    setNickname(bike.nickname || '');
    setInsuranceExpiry(bike.insuranceDate || bike.insuranceExpiry || '');
    setPollutionExpiry(bike.pollutionDate || bike.pollutionExpiry || '');
    setEditingBikeId(bike.id);
    setModalVisible(true);
  };

  const handleSaveBike = async () => {
    if (!nickname.trim()) {
      Alert.alert("Required", "Please enter a nickname for your vehicle.");
      return;
    }

    let isInsuranceNearDue = false;
    let diffDays = 0;

    if (insuranceExpiry.length === 10) {
      const [day, month, year] = insuranceExpiry.split('/');
      const expDate = new Date(`${year}-${month}-${day}`);
      if (!isNaN(expDate)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = expDate - today;
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 30) {
          isInsuranceNearDue = true;
        }
      }
    }

    const bikeId = editingBikeId || Date.now().toString();
    const bikeData = {
      id: bikeId,
      model: tempModel,
      nickname: nickname,
      insuranceDate: insuranceExpiry,
      pollutionDate: pollutionExpiry,
      isInsuranceNearDue: isInsuranceNearDue
    };

    try {
      let newBikes = [...myBikes];
      if (editingBikeId) {
        newBikes = newBikes.map(b => b.id === editingBikeId ? bikeData : b);
      } else {
        newBikes.push(bikeData);
      }
      
      const newActiveId = activeBikeId || bikeId;

      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { myBikes: newBikes, activeBikeId: newActiveId }, { merge: true });
      }

      await AsyncStorage.setItem('user_garage_data', JSON.stringify({ bike_model: tempModel }));
      await AsyncStorage.setItem('selected_bike', tempModel);

      setMyBikes(newBikes);
      setActiveBikeId(newActiveId);
      
      setModalVisible(false);
      setSelectedBrand(null);
      setIsAddingNew(false);
      setEditingBikeId(null);

      if (isInsuranceNearDue) {
        Alert.alert('⚠️ Reminder', `Your Insurance expires in ${diffDays >= 0 ? diffDays : 0} days! Renew soon.`);
      } else {
        Alert.alert("Success", "Vehicle details saved successfully!", [{ text: 'OK' }]);
      }
    } catch (e) {
      console.error("Error saving vehicle", e);
      Alert.alert("Error", "Could not save vehicle details.");
    }
  };

  const handleClearGarage = () => {
      Alert.alert(
        "Remove Vehicle",
        "Are you sure you want to remove this vehicle?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                const user = auth.currentUser;
                const newBikes = myBikes.filter(b => b.id !== activeBikeId);
                const newActiveId = newBikes.length > 0 ? newBikes[0].id : null;
                
                if (user) {
                  const userDocRef = doc(db, 'users', user.uid);
                  await setDoc(userDocRef, { myBikes: newBikes, activeBikeId: newActiveId }, { merge: true });
                }
                
                if (!newActiveId) {
                  await AsyncStorage.removeItem('user_garage_data');
                  await AsyncStorage.removeItem('selected_bike');
                } else {
                  const activeBikeModel = newBikes.find(b => b.id === newActiveId)?.model;
                  if (activeBikeModel) {
                     await AsyncStorage.setItem('user_garage_data', JSON.stringify({ bike_model: activeBikeModel }));
                     await AsyncStorage.setItem('selected_bike', activeBikeModel);
                  }
                }
                
                setMyBikes(newBikes);
                setActiveBikeId(newActiveId);
              } catch (e) {
                console.error("Error clearing vehicle", e);
              }
            }
          }
        ]
      );
  };
  
  const handleSetActive = async (id) => {
    setActiveBikeId(id);
    const selectedBike = myBikes.find(b => b.id === id);
    if (!selectedBike) return;
    
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { activeBikeId: id }, { merge: true });
      }
      await AsyncStorage.setItem('user_garage_data', JSON.stringify({ bike_model: selectedBike.model }));
      await AsyncStorage.setItem('selected_bike', selectedBike.model);
    } catch (e) {
      console.error('Error setting active bike:', e);
    }
  };

  const renderBrand = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => handleBrandSelect(item.brand)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="business" size={24} color={theme.primary} style={{ marginRight: 15 }} />
        <Text style={[styles.text, { color: theme.text }]}>{item.brand}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#888" />
    </TouchableOpacity>
  );

  const renderModel = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }]}
      onPress={() => handleModelSelect(item)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="bicycle" size={24} color={theme.primary} style={{ marginRight: 15 }} />
        <Text style={[styles.text, { color: theme.text }]}>{item}</Text>
      </View>
      <Ionicons name="add-circle-outline" size={26} color={theme.primary} />
    </TouchableOpacity>
  );

  const currentModels = selectedBrand ? BIKE_DATABASE.find(b => b.brand === selectedBrand)?.models || [] : [];
  
  const activeBike = myBikes.find(b => b.id === activeBikeId);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.primary }]}>My Garage 🏍️</Text>
      <Text style={[styles.sub, { color: '#888' }]}>Manage your vehicles to filter parts automatically.</Text>

      {/* Adding Brand / Model Flow */}
      {isAddingNew ? (
        <>
          {selectedBrand ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedBrand(null)}>
              <Ionicons name="arrow-back" size={20} color={theme.primary} />
              <Text style={[styles.backText, { color: theme.primary }]}>Back to Brands</Text>
            </TouchableOpacity>
          ) : (
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Select Vehicle Brand</Text>
                <TouchableOpacity onPress={() => setIsAddingNew(false)}>
                   <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Cancel</Text>
                </TouchableOpacity>
             </View>
          )}

          {!selectedBrand ? (
            <FlatList
              data={BIKE_DATABASE}
              keyExtractor={item => item.brand}
              renderItem={renderBrand}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={currentModels}
              keyExtractor={item => item}
              renderItem={renderModel}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      ) : (
        /* View vehicles mode */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Active Vehicle Card */}
          {activeBike ? (
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>Active Vehicle</Text>
              <View style={styles.activeCard}>
                <View style={styles.activeHeader}>
                  <Ionicons name="star" size={20} color="#fff" />
                  <Text style={styles.activeLabel}>Active Vehicle</Text>
                  <TouchableOpacity onPress={handleClearGarage} style={{ marginLeft: 'auto' }}>
                    <View style={styles.trashCircle}>
                      <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.nicknameText}>{activeBike.nickname}</Text>
                <Text style={styles.modelText}>{activeBike.model}</Text>

                <View style={styles.datesContainer}>
                  <View style={styles.dateBox}>
                    <View style={styles.dateLabelRow}>
                      <Ionicons name="shield-checkmark" size={14} color="#A5D6A7" />
                      <Text style={styles.dateLabel}> Insurance</Text>
                    </View>
                    <Text style={styles.dateValue}>{activeBike.insuranceDate || activeBike.insuranceExpiry || 'Not set'}</Text>
                  </View>
                  <View style={styles.dateDivider} />
                  <View style={styles.dateBox}>
                    <View style={styles.dateLabelRow}>
                      <Ionicons name="leaf" size={14} color="#A5D6A7" />
                      <Text style={styles.dateLabel}> PUC Expiry</Text>
                    </View>
                    <Text style={styles.dateValue}>{activeBike.pollutionDate || activeBike.pollutionExpiry || 'Not set'}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.editBtn} onPress={() => handleEditBike(activeBike)}>
                  <Ionicons name="pencil" size={14} color="#00A3E0" />
                  <Text style={styles.editBtnText}>Edit Details</Text>
                </TouchableOpacity>
              </View>
              
              {/* My Vehicles List */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 10 }}>
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0, marginTop: 0 }]}>My Vehicles</Text>
                <TouchableOpacity onPress={() => setIsAddingNew(true)}>
                   <Text style={{ color: theme.primary, fontWeight: 'bold' }}>+ Add New Vehicle</Text>
                </TouchableOpacity>
              </View>
              
              {myBikes.map(bike => {
                 const isActive = bike.id === activeBikeId;
                 return (
                   <TouchableOpacity 
                     key={bike.id} 
                     style={[styles.card, { backgroundColor: theme.card, borderWidth: isActive ? 1 : 0, borderColor: theme.primary, marginBottom: 8 }]}
                     onPress={() => handleSetActive(bike.id)}
                   >
                     <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                       <Ionicons name="bicycle" size={24} color={isActive ? theme.primary : 'gray'} style={{ marginRight: 15 }} />
                       <View>
                         <Text style={[styles.text, { color: theme.text }]}>{bike.nickname}</Text>
                         <Text style={{ color: 'gray', fontSize: 13, marginTop: 2 }}>{bike.model}</Text>
                       </View>
                     </View>
                     {isActive ? (
                       <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                     ) : (
                       <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'gray' }} />
                     )}
                   </TouchableOpacity>
                 );
              })}
            </View>
          ) : (
             <>
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Ionicons name="bicycle-outline" size={60} color="gray" />
                  <Text style={{ color: 'gray', marginTop: 15, fontSize: 16 }}>Your garage is empty.</Text>
                  <TouchableOpacity 
                    style={[styles.saveBtn, { width: 200, marginTop: 20 }]} 
                    onPress={() => setIsAddingNew(true)}
                  >
                    <Text style={styles.saveBtnText}>+ Add Vehicle</Text>
                  </TouchableOpacity>
                </View>
             </>
          )}
        </ScrollView>
      )}

      {/* Modal for Bike Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.modalView, { backgroundColor: theme.card }]}
            activeOpacity={1}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{editingBikeId ? 'Edit Vehicle' : 'Vehicle Details'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: theme.primary }]}>{tempModel}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Nickname *</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border || '#DDD' }]}
                  placeholder="e.g. My Beast"
                  placeholderTextColor="#888"
                  value={nickname}
                  onChangeText={setNickname}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Insurance Expiry</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border || '#DDD' }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#888"
                  value={insuranceExpiry}
                  onChangeText={(text) => handleDateInput(text, setInsuranceExpiry)}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Pollution (PUC) Expiry</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border || '#DDD' }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#888"
                  value={pollutionExpiry}
                  onChangeText={(text) => handleDateInput(text, setPollutionExpiry)}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBike}>
                <Text style={styles.saveBtnText}>Save Vehicle</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  sub: { fontSize: 14, marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 5,
  },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, marginBottom: 10, borderRadius: 10, elevation: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2
  },
  text: { fontSize: 16, fontWeight: '500' },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10,
    backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 8, alignSelf: 'flex-start'
  },
  backText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  // Active Vehicle Card Styling (Professional Blue Theme)
  activeCard: {
    backgroundColor: '#00A3E0', // Professional Blue
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#00A3E0',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activeLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trashCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 6,
    borderRadius: 15,
  },
  nicknameText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  datesContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dateBox: {
    flex: 1,
  },
  dateDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 10,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  dateValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#00A3E0',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },

  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalSub: {
    fontSize: 16,
    marginBottom: 25,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  saveBtn: {
    backgroundColor: '#00A3E0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#00A3E0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
