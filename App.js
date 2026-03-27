import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // 👈 IMPORT THIS
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './src/config/firebase';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

// --- IMPORT SCREENS ---
import LoginScreen from './src/screens/LoginScreen';
import PartsScreen from './src/screens/PartsScreen';
import MapScreen from './src/screens/MapScreen';
import SOSScreen from './src/screens/SOSScreen';
import VedioHubScreen from './src/screens/VedioHubScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MyGarageScreen from './src/screens/MyGarageScreen';
import ShopkeeperDashboard from './src/screens/ShopkeeperDashboard';
import MechanicDashboard from './src/screens/MechanicDashboard';
import AboutScreen from './src/screens/AboutScreen'; // 👈 IMPORT ABOUT SCREEN
import EditProfileScreen from './src/screens/EditProfileScreen';
import ShopProfileScreen from './src/screens/ShopProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator(); // 👈 CREATE STACK NAVIGATOR

// --- 1. RIDER NAVIGATION (Tabs) ---
function RiderTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.headerText,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.background },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'alert-circle';
          if (route.name === 'Parts') iconName = 'construct';
          else if (route.name === 'Map') iconName = 'map';
          else if (route.name === 'SOS') iconName = 'warning';
          else if (route.name === 'Videos') iconName = 'play-circle';
          else if (route.name === 'Settings') iconName = 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Parts" component={PartsScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="SOS" component={SOSScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Videos" component={VedioHubScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// --- RIDER STACK (To hide MyGarage from tabs but keep navigation) ---
function RiderStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RiderTabs" component={RiderTabs} />
      <Stack.Screen
        name="MyGarage"
        component={MyGarageScreen}
        options={{

          headerShown: true,
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.headerText,
          title: 'My Garage'
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: true,
          title: 'About SPARE',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.headerText,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: 'My Profile',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.headerText,
        }}
      />
      <Stack.Screen
        name="ShopProfile"
        component={ShopProfileScreen}
        options={{
          headerShown: true,
          title: 'Shop Profile',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.headerText,
        }}
      />
    </Stack.Navigator>
  );
}

// --- 2. SHOPKEEPER STACK (Fixes the error!) ---
function ShopkeeperStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.headerText,
      }}
    >
      <Stack.Screen name="ShopDashboard" component={ShopkeeperDashboard} options={{ title: 'Shop Manager' }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: 'My Profile',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.headerText,
        }}
      />
    </Stack.Navigator>
  );
}

// --- 3. MECHANIC STACK ---
function MechanicStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.headerText,
      }}
    >
      <Stack.Screen name="MechDashboard" component={MechanicDashboard} options={{ title: 'Service Manager' }} />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          headerShown: true,
          title: 'My Profile',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.headerText,
        }}
      />
    </Stack.Navigator>
  );
}

// --- MAIN APP ---
export default function App() {
  return (
    <ThemeProvider>
      <ThemeApp />
    </ThemeProvider>
  );
}

// Internal component to use the Theme hook inside ThemeProvider
function ThemeApp() {
  const { theme, isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole('rider');
          }
        } catch (e) {
          console.error(e);
          setUserRole('rider');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const navigationTheme = isDarkMode
    ? { ...NavDarkTheme, colors: { ...NavDarkTheme.colors, background: theme.background, card: theme.card, text: theme.text, border: theme.background, primary: theme.primary } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.background, card: theme.card, text: theme.text, border: theme.background, primary: theme.primary } };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1, backgroundColor: theme.background }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationContainer theme={navigationTheme}>
        {!user ? (
          <LoginScreen />
        ) : userRole === 'shopkeeper' ? (
          <ShopkeeperStack />
        ) : userRole === 'mechanic' ? (
          <MechanicStack />
        ) : (
          <RiderStack />
        )}
      </NavigationContainer>
    </View>
  );
}