import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { AUTOMOTIVE_THEME } from '../config/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('rider');
  const [loading, setLoading] = useState(false);

  // Role configurations
  const roles = [
    { id: 'rider', label: 'Rider', emoji: '🏍️', icon: 'bicycle' },
    { id: 'mechanic', label: 'Mechanic', emoji: '🔧', icon: 'hammer' },
    { id: 'shopkeeper', label: 'Shopkeeper', emoji: '🏪', icon: 'storefront' },
  ];

  // Get welcome message based on selected role
  const getWelcomeMessage = () => {
    const roleConfig = roles.find(r => r.id === selectedRole);
    switch (selectedRole) {
      case 'rider':
        return `Welcome, Rider! 🏍️`;
      case 'mechanic':
        return `Welcome, Mechanic! 🔧`;
      case 'shopkeeper':
        return `Welcome, Shopkeeper! 🏪`;
      default:
        return 'Welcome!';
    }
  };

  const handleAuth = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!isLogin && email && password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!isLogin && (!fullName.trim() || !phone.trim())) {
      Alert.alert('Error', 'Please enter your full name and phone number');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the user's role in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          role: selectedRole, // update selected role
        }, { merge: true });
      } else {
        // --- SIGN UP LOGIC ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save the user's role and additional info to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: selectedRole, // 'rider', 'mechanic', or 'shopkeeper'
          name: fullName.trim(),
          phone: phone.trim(),
          createdAt: new Date().toISOString(),
          displayName: fullName.trim() || email.split('@')[0],
        });

        Alert.alert('Success', 'Account created successfully!');
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address to reset your password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent! Please check your inbox.');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Dynamic Welcome Message */}
      <View style={styles.headerContainer}>
        <Text style={styles.appTitle}>SPARE</Text>
        <Text style={styles.welcomeMessage}>{getWelcomeMessage()}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to continue' : 'Create your account'}
        </Text>
      </View>

      {/* Role Selector Cards */}
      <View style={styles.roleSelector}>
        <Text style={styles.roleSelectorLabel}>Select Your Role</Text>
        <View style={styles.roleCardsContainer}>
          {roles.map(role => (
            <TouchableOpacity
              key={role.id}
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(role.id)}
            >
              <View
                style={[
                  styles.roleIconContainer,
                  selectedRole === role.id &&
                  styles.roleIconContainerSelected,
                ]}
              >
                <Ionicons
                  name={role.icon}
                  size={28}
                  color={
                    selectedRole === role.id
                      ? AUTOMOTIVE_THEME.background
                      : AUTOMOTIVE_THEME.text
                  }
                />
              </View>
              <Text
                style={[
                  styles.roleLabel,
                  selectedRole === role.id && styles.roleLabelSelected,
                ]}
              >
                {role.label}
              </Text>
              {selectedRole === role.id && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={AUTOMOTIVE_THEME.secondary}
                  />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Extra Inputs for Sign Up */}
      {!isLogin && (
        <>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="person"
              size={20}
              color={AUTOMOTIVE_THEME.accent}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#B0BEC5"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />
          </View>

          {/* Phone Number Input */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="call"
              size={20}
              color={AUTOMOTIVE_THEME.accent}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#B0BEC5"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>
        </>
      )}

      {/* Email Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="mail"
          size={20}
          color={AUTOMOTIVE_THEME.accent}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#B0BEC5"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed"
          size={20}
          color={AUTOMOTIVE_THEME.accent}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#B0BEC5"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={{ padding: 5 }}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off" : "eye"}
            size={22}
            color={AUTOMOTIVE_THEME.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Forgot Password Link */}
      {isLogin && (
        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={AUTOMOTIVE_THEME.background} size="small" />
        ) : (
          <>
            <Ionicons
              name={isLogin ? 'log-in' : 'person-add'}
              size={20}
              color={AUTOMOTIVE_THEME.background}
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>
              {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Toggle Login/Signup */}
      <View style={styles.toggleContainer}>
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
        </Text>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleLink}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: AUTOMOTIVE_THEME.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },

  // Header Styles
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: AUTOMOTIVE_THEME.primary,
    marginBottom: 16,
    letterSpacing: 2,
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: '700',
    color: AUTOMOTIVE_THEME.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: AUTOMOTIVE_THEME.accent,
    textAlign: 'center',
  },

  // Role Selector Styles
  roleSelector: {
    marginBottom: 28,
  },
  roleSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AUTOMOTIVE_THEME.text,
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AUTOMOTIVE_THEME.borderColor,
    backgroundColor: AUTOMOTIVE_THEME.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardSelected: {
    borderColor: AUTOMOTIVE_THEME.primary,
    backgroundColor: AUTOMOTIVE_THEME.primaryLight,
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AUTOMOTIVE_THEME.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleIconContainerSelected: {
    backgroundColor: AUTOMOTIVE_THEME.primary,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AUTOMOTIVE_THEME.text,
    textAlign: 'center',
  },
  roleLabelSelected: {
    color: AUTOMOTIVE_THEME.primary,
    fontWeight: '700',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Input Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: AUTOMOTIVE_THEME.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AUTOMOTIVE_THEME.borderColor,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: AUTOMOTIVE_THEME.text,
  },

  // Button Styles
  button: {
    backgroundColor: AUTOMOTIVE_THEME.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: AUTOMOTIVE_THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: AUTOMOTIVE_THEME.background,
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },

  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginRight: 5,
  },
  forgotPasswordText: {
    color: AUTOMOTIVE_THEME.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Toggle Styles
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  toggleText: {
    fontSize: 14,
    color: AUTOMOTIVE_THEME.text,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
    color: AUTOMOTIVE_THEME.primary,
    textDecorationLine: 'underline',
  },

  // Footer Styles
  footerContainer: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AUTOMOTIVE_THEME.borderColor,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: AUTOMOTIVE_THEME.accent,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});