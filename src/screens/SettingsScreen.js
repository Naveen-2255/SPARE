import React from 'react';
import { Button, Text, View, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase'; // Correct path
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    signOut(auth).catch(error => console.error('Error logging out: ', error));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

      {/* My Garage Button */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: theme.card }]}
        onPress={() => navigation.navigate('MyGarage')}
      >
        <Text style={{ fontSize: 24, marginRight: 15 }}>🏍️</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.menuButtonText, { color: theme.navigationText, marginLeft: 0 }]}>My Garage</Text>
          <Text style={[styles.menuSubText, { color: theme.text || '#888', opacity: 0.7 }]}>Manage your bike details & reminders</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.navigationText} />
      </TouchableOpacity>

      {/* Dark Mode Toggle */}
      <View style={[styles.menuButton, { backgroundColor: theme.card }]}>
        <Ionicons name="moon" size={24} color={theme.navigationText} />
        <Text style={[styles.menuButtonText, { color: theme.navigationText }]}>Dark Mode</Text>
        <Switch
          value={isDarkMode}
          onValueChange={toggleTheme}
          trackColor={{ false: '#767577', true: '#00A3E0' }}
          thumbColor={isDarkMode ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: theme.card }]}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Ionicons name="person-circle-outline" size={24} color={theme.navigationText} />
        <Text style={[styles.menuButtonText, { color: theme.navigationText }]}>Edit Profile</Text>
        <Ionicons name="chevron-forward" size={24} color={theme.navigationText} />
      </TouchableOpacity>

      {/* About App Button */}
      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: theme.card }]}
        onPress={() => navigation.navigate('About')}
      >
        <Ionicons name="information-circle" size={24} color={theme.navigationText} />
        <Text style={[styles.menuButtonText, { color: theme.navigationText }]}>About the App</Text>
        <Ionicons name="chevron-forward" size={24} color={theme.navigationText} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.error || '#DC2F02' }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={24} color={theme.white || '#FFF'} />
        <Text style={[styles.logoutText, { color: theme.white || '#FFF' }]}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    alignSelf: 'flex-start',
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  menuSubText: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 'auto',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});