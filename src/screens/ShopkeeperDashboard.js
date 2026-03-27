import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity,
  Modal, Alert, ActivityIndicator, Switch, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import {
  collection, query, where, onSnapshot, doc, updateDoc,
  addDoc, getDocs, or, limit
} from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

export default function ShopkeeperDashboard({ navigation }) {
  const { theme } = useTheme();
  const [shopProfile, setShopProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Shop setup state
  const [shopNameInput, setShopNameInput] = useState('');
  const [shopPhoneInput, setShopPhoneInput] = useState('');
  const [gstInput, setGstInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('');

  // Top Card / Shop Management State
  const [openTimeInput, setOpenTimeInput] = useState('');
  const [closeTimeInput, setCloseTimeInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Add Part Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [partNameInput, setPartNameInput] = useState('');
  const [bikeModelInput, setBikeModelInput] = useState('');
  const [partPriceInput, setPartPriceInput] = useState('');
  const [isAddingPart, setIsAddingPart] = useState(false);

  // Edit Price Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [editPriceInput, setEditPriceInput] = useState('');

  // Claim Shop Modal State
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [availableShops, setAvailableShops] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // 1. Fetch Shop Profile
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, "mechanics"), where("owner_id", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docRef = snapshot.docs[0];
        const shopData = docRef.data();
        setShopProfile({ id: docRef.id, ...shopData });
        setOpenTimeInput(shopData.openTime || shopData.open_time || '9:00 AM');
        setCloseTimeInput(shopData.closeTime || shopData.close_time || '9:00 PM');
        setIsOpen(shopData.isOpen || false);
      } else {
        setShopProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Fetch Inventory
  // ONLY listen for owner_id matching the authenticated user
  useEffect(() => {
    if (!shopProfile) return;

    const user = auth.currentUser;
    if (!user || !user.uid) return;

    const q = query(collection(db, "parts"), where("owner_id", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setInventory(parts);
    }, (error) => {
      console.error("Error fetching inventory by owner_id:", error);
    });

    return () => unsubscribe();
  }, [shopProfile]);

  // Logout Header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => auth.signOut()} style={{ marginRight: 15 }}>
          <Ionicons name="log-out-outline" size={28} color={theme.headerText} />
        </TouchableOpacity>
      ),
      title: shopProfile ? shopProfile.name : "Setup Shop",
      headerStyle: { backgroundColor: theme.primary },
      headerTintColor: theme.headerText
    });
  }, [navigation, shopProfile, theme]);

  // Shop Actions
  const handleCreateShop = async () => {
    if (!shopNameInput || !shopPhoneInput || !gstInput || !licenseInput) {
      return Alert.alert("Error", "Fill all required fields");
    }
    try {
      await addDoc(collection(db, "mechanics"), {
        name: shopNameInput,
        phone: shopPhoneInput,
        gst_number: gstInput,
        license_number: licenseInput,
        openTime: openTimeInput || "9:00 AM",
        closeTime: closeTimeInput || "9:00 PM",
        isOpen: false,
        owner_id: auth.currentUser.uid,
        status: "approved",
        latitude: 12.9716,
        longitude: 77.5946
      });
      Alert.alert("Success", "Shop Registered!");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const toggleShopStatus = async () => {
    if (!shopProfile) return;
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    try {
      await updateDoc(doc(db, "mechanics", shopProfile.id), { isOpen: newStatus });
    } catch (e) {
      Alert.alert("Error", "Could not toggle shop status.");
      setIsOpen(!newStatus);
    }
  };

  const updateTimings = async () => {
    if (!shopProfile) return;
    if (!openTimeInput || !closeTimeInput) return Alert.alert("Error", "Enter valid timings");
    try {
      await updateDoc(doc(db, "mechanics", shopProfile.id), {
        openTime: openTimeInput,
        closeTime: closeTimeInput,
        isOpen: isOpen
      });
      Alert.alert("Success", "Timings updated successfully.");
    } catch (e) {
      Alert.alert("Error", "Could not update timings.");
    }
  };

  // Inventory Actions
  const handleAddNewPart = async () => {
    if (!shopProfile) {
      Alert.alert("Error", "Shop profile not loaded yet.");
      return;
    }

    if (!partNameInput.trim() || !bikeModelInput.trim() || !partPriceInput.trim()) {
      Alert.alert("Error", "Please fill all part details.");
      return;
    }

    const priceValue = parseFloat(partPriceInput);
    if (isNaN(priceValue)) {
      Alert.alert("Error", "Price must be a valid number.");
      return;
    }

    setIsAddingPart(true);

    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "parts"), {
        shop_name: shopProfile.name, // CRITICAL
        shop_id: shopProfile.id,
        owner_id: user.uid,
        name: partNameInput.trim(),
        bike_model: String(bikeModelInput.trim()), // Explicit string cast
        price: priceValue, // Explicit number cast
        in_stock: true,
        createdAt: new Date().toISOString()
      });

      // Clear only after success
      setPartNameInput('');
      setBikeModelInput('');
      setPartPriceInput('');
      setAddModalVisible(false);
      Alert.alert("Success", "Part added successfully!");
    } catch (e) {
      console.error("Error adding part:", e);
      Alert.alert("Error", "Could not add part. Try again.");
    } finally {
      setIsAddingPart(false);
    }
  };
  const toggleStock = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "parts", id), { in_stock: !currentStatus });
    } catch (e) {
      Alert.alert("Error", "Could not update stock status.");
    }
  };

  const handleEditPrice = (part) => {
    setEditingPart(part);
    setEditPriceInput(part.price ? part.price.toString() : '');
    setEditModalVisible(true);
  };

  const saveEditedPrice = async () => {
    if (!editingPart || !editPriceInput) return;
    try {
      await updateDoc(doc(db, "parts", editingPart.id), { price: editPriceInput });
      setEditModalVisible(false);
      setEditingPart(null);
      setEditPriceInput('');
      Alert.alert("Success", "Price updated!");
    } catch (e) {
      Alert.alert("Error", "Could not update price.");
    }
  };

  const fetchAvailableShops = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "parts"));
      const querySnapshot = await getDocs(q);

      const shops = new Set();
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.shop_name) {
          shops.add(data.shop_name);
        }
      });

      setAvailableShops(Array.from(shops));
      setClaimModalVisible(true);
    } catch (error) {
      console.error("Error fetching shops:", error);
      Alert.alert("Error", "Could not fetch available shops.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimShop = async (selectedShopName) => {
    if (!shopProfile) return;
    try {
      setIsClaiming(true);

      // Update mechanic profile name
      await updateDoc(doc(db, "mechanics", shopProfile.id), {
        name: selectedShopName
      });

      // Update local profile state immediately for better UX
      setShopProfile(prev => ({ ...prev, name: selectedShopName }));

      // Update parts owner_id
      const q = query(collection(db, "parts"), where("shop_name", "==", selectedShopName));
      const querySnapshot = await getDocs(q);

      const user = auth.currentUser;
      const updatePromises = querySnapshot.docs.map(partDoc => {
        return updateDoc(doc(db, "parts", partDoc.id), {
          owner_id: user.uid,
          shop_id: shopProfile.id // Align the shop_id as well
        });
      });

      await Promise.all(updatePromises);

      setClaimModalVisible(false);
      Alert.alert("Success", "Shop Claimed & Inventory Synced!");
    } catch (error) {
      console.error("Claim error:", error);
      Alert.alert("Error", "Could not claim shop.");
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDebugShowData = async () => {
    try {
      const q = query(collection(db, "parts"), limit(3));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Debug", "No parts found in the database.");
        return;
      }

      const firstPartData = querySnapshot.docs[0].data();
      Alert.alert("Debug: First Part Data", JSON.stringify(firstPartData, null, 2));
    } catch (error) {
      console.error("Debug error:", error);
      Alert.alert("Error", "Could not fetch debug data.");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, backgroundColor: theme.background }} color={theme.primary} />;

  const filteredInventory = inventory.filter(part => {
    const q = searchQuery.toLowerCase();
    const nameMatch = part.name && part.name.toLowerCase().includes(q);
    const bikeMatch = part.bike_model && part.bike_model.toLowerCase().includes(q);
    return nameMatch || bikeMatch;
  });

  // View 1: Setup
  if (!shopProfile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.primary }]}>Setup Your Shop</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholderTextColor="gray" placeholder="Shop Name *" value={shopNameInput} onChangeText={setShopNameInput} />
        <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholderTextColor="gray" placeholder="Phone Number *" value={shopPhoneInput} onChangeText={setShopPhoneInput} keyboardType="phone-pad" />
        <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholderTextColor="gray" placeholder="GST Number *" value={gstInput} onChangeText={setGstInput} />
        <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholderTextColor="gray" placeholder="Shop License Number *" value={licenseInput} onChangeText={setLicenseInput} />
        <TouchableOpacity style={[styles.btn, { backgroundColor: theme.primary }]} onPress={handleCreateShop}>
          <Text style={styles.btnText}>Create Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // View 2: Dashboard
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* SECTION 1: SHOP MANAGEMENT */}
      <View style={[styles.shopManagementCard, { backgroundColor: theme.card }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Shop Management</Text>

        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: theme.text }]}>
            Status: {isOpen ? '🟢 Open' : '🔴 Closed'}
          </Text>
          <Switch value={isOpen} onValueChange={toggleShopStatus} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isOpen ? "#007AFF" : "#f4f3f4"} />
        </View>

        <View style={styles.timingRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.label, { color: theme.text }]}>Opening Time</Text>
            <TextInput style={[styles.timingInput, { backgroundColor: theme.background, color: theme.text }]} placeholder="9:00 AM" placeholderTextColor="gray" value={openTimeInput} onChangeText={setOpenTimeInput} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.text }]}>Closing Time</Text>
            <TextInput style={[styles.timingInput, { backgroundColor: theme.background, color: theme.text }]} placeholder="9:00 PM" placeholderTextColor="gray" value={closeTimeInput} onChangeText={setCloseTimeInput} />
          </View>
        </View>
        <TouchableOpacity style={[styles.updateBtn, { backgroundColor: theme.primary }]} onPress={updateTimings}>
          <Text style={styles.btnText}>Update Timings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.subtitle, { color: theme.text }]}>My Inventory ({inventory.length})</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#007AFF', marginRight: 10 }]} onPress={fetchAvailableShops}>
            <Text style={styles.addBtnText}>Claim Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)}>
            <Text style={styles.addBtnText}>+ Add Part</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- INVENTORY SEARCH BAR --- */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color="gray" style={{ marginRight: 10 }} />
        <TextInput 
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by part name or bike model..."
          placeholderTextColor="gray"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="gray" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredInventory}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, color: theme.text, fontSize: 16 }}>No parts found for {shopProfile.name}. Add parts using the button above.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.partName, { color: theme.text }]}>{item.name}</Text>
              <Text style={{ color: 'gray' }}>{item.bike_model}</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
                <Text style={{ fontWeight: 'bold', color: '#007AFF', fontSize: 16 }}>₹{item.price}</Text>
                <TouchableOpacity onPress={() => handleEditPrice(item)} style={{ marginLeft: 10 }}>
                  <Ionicons name="pencil" size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5 }}>{item.in_stock ? 'Stock In' : 'Stock Out'}</Text>
              <Switch value={item.in_stock} onValueChange={() => toggleStock(item.id, item.in_stock)} trackColor={{ false: "#767577", true: "#81b0ff" }} />
            </View>
          </View>
        )}
      />

      {/* EDIT PRICE MODAL */}
      <Modal visible={editModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Price</Text>
            {editingPart && <Text style={{ color: theme.text, marginBottom: 10 }}>{editingPart.name}</Text>}
            <TextInput style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]} placeholderTextColor="gray" placeholder="New Price (₹)" value={editPriceInput} onChangeText={setEditPriceInput} keyboardType="numeric" />

            <View style={{ flexDirection: 'row', marginTop: 15 }}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={[styles.modalBtn, { backgroundColor: 'red' }]}>
                <Text style={{ color: 'white' }}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity onPress={saveEditedPrice} style={[styles.modalBtn, { backgroundColor: 'green' }]}>
                <Text style={{ color: 'white' }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CLAIM SHOP MODAL */}
      <Modal visible={claimModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, maxHeight: '80%' }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Claim Existing Shop</Text>

            {availableShops.length === 0 ? (
              <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 20 }}>No shops available to claim.</Text>
            ) : (
              <FlatList
                data={availableShops}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      padding: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: '#ddd',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onPress={() => handleClaimShop(item)}
                    disabled={isClaiming}
                  >
                    <Text style={{ color: theme.text, fontSize: 16 }}>{item}</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.text} />
                  </TouchableOpacity>
                )}
                style={{ marginBottom: 15 }}
              />
            )}

            <TouchableOpacity
              onPress={() => setClaimModalVisible(false)}
              style={[styles.modalBtn, { backgroundColor: 'red', marginTop: 10 }]}
              disabled={isClaiming}
            >
              <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>

            {isClaiming && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10 }}>
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ADD PART MODAL */}
      <Modal visible={addModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Part</Text>

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]}
              placeholderTextColor="gray"
              placeholder="Part Name (e.g. Brake Pad)"
              value={partNameInput}
              onChangeText={setPartNameInput}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]}
              placeholderTextColor="gray"
              placeholder="Bike Model (e.g. Royal Enfield Classic 350)"
              value={bikeModelInput}
              onChangeText={setBikeModelInput}
            />

            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.text }]}
              placeholderTextColor="gray"
              placeholder="Price (₹)"
              value={partPriceInput}
              onChangeText={setPartPriceInput}
              keyboardType="numeric"
            />

            <View style={{ flexDirection: 'row', marginTop: 15 }}>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: 'red' }]}
                disabled={isAddingPart}
              >
                <Text style={{ color: 'white' }}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ width: 10 }} />
              <TouchableOpacity
                onPress={handleAddNewPart}
                style={[styles.modalBtn, { backgroundColor: 'green', flexDirection: 'row', justifyContent: 'center' }]}
                disabled={isAddingPart}
              >
                {isAddingPart ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={{ color: 'white' }}>Save Part</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subtitle: { fontSize: 18, fontWeight: 'bold' },
  input: { padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  btn: { padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  addBtn: { backgroundColor: '#28a745', padding: 8, borderRadius: 8 },
  addBtnText: { color: 'white', fontWeight: 'bold' },
  card: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  partName: { fontSize: 16, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 15, elevation: 2 },
  searchInput: { flex: 1, fontSize: 16 },
  shopManagementCard: { padding: 15, borderRadius: 10, elevation: 3, marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  statusText: { fontSize: 16, fontWeight: '600' },
  timingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  label: { fontSize: 14, marginBottom: 5, fontWeight: '500' },
  timingInput: { padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  updateBtn: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  modalBg: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalBox: { width: '85%', padding: 20, borderRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalInput: { borderBottomWidth: 1, marginBottom: 15, padding: 8, fontSize: 16 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 5, alignItems: 'center' },
});
