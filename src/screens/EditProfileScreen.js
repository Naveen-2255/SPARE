import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'No user logged in');
                setLoading(false);
                return;
            }

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                setName(data.name || data.displayName || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim(),
            });

            Alert.alert('Success', 'Profile Updated Successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1B3A57" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Profile Placeholder */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarPlaceholder}>
                        <Ionicons name="person" size={60} color="#1B3A57" />
                    </View>
                    <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
                </View>

                {/* Form Inputs */}
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Full Name</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#1B3A57" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="call-outline" size={20} color="#1B3A57" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <Text style={styles.label}>Address</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="location-outline" size={20} color="#1B3A57" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Enter your full address"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA', // Light background for contrast
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    scrollContainer: {
        padding: 20,
        flexGrow: 1,
    },
    avatarContainer: {
        alignItems: 'center',
        marginVertical: 30,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E1E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1B3A57',
        marginBottom: 10,
        shadowColor: '#1B3A57',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    emailText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    formContainer: {
        marginBottom: 30,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1B3A57',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#D1D9E6',
        borderRadius: 12,
        marginBottom: 20,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 80,
        paddingTop: 12,
    },
    saveButton: {
        backgroundColor: '#1B3A57',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#1B3A57',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 'auto',
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});
