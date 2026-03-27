import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
    const { theme } = useTheme();

    const handleContactDev = () => {
        Linking.openURL('mailto:naveenjosephvadakkel@gmail.com?subject=SPARE App Inquiry');
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.contentContainer}
        >
            {/* App Logo / Header Area */}
            <View style={styles.headerArea}>
                <View style={styles.logoPlaceholder}>
                    <Ionicons name="construct-outline" size={60} color={theme.white} />
                </View>
                <Text style={[styles.appName, { color: theme.primary }]}>SPARE</Text>
                <Text style={[styles.version, { color: theme.accent }]}>v2.0</Text>
            </View>

            {/* Mission Statement */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.navigationText }]}>Our Mission</Text>
                <Text style={[styles.missionText, { color: theme.navigationText }]}>
                    Connecting Riders with Shops seamlessly. Whether you're stranded on the road or looking for a regular checkup, SPARE bridges the gap between those in need and skilled mechanics or shopkeepers ready to help.
                </Text>
            </View>

            {/* Features Outline */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.navigationText }]}>Key Features</Text>
                <View style={styles.featureItem}>
                    <Ionicons name="map" size={20} color={theme.accent} style={styles.featureIcon} />
                    <Text style={[styles.featureText, { color: theme.navigationText }]}>Find nearby mechanics on the map</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="cart" size={20} color={theme.accent} style={styles.featureIcon} />
                    <Text style={[styles.featureText, { color: theme.navigationText }]}>Browse spare parts from local shops</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="warning" size={20} color={theme.error || '#DC2F02'} style={styles.featureIcon} />
                    <Text style={[styles.featureText, { color: theme.navigationText }]}>Emergency SOS requests</Text>
                </View>
                <View style={styles.featureItem}>
                    <Ionicons name="play-circle" size={20} color={theme.accent} style={styles.featureIcon} />
                    <Text style={[styles.featureText, { color: theme.navigationText }]}>Video repair guides</Text>
                </View>
            </View>

            {/* Contact Button */}
            <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: theme.primary }]}
                onPress={handleContactDev}
            >
                <Ionicons name="mail" size={20} color="white" style={styles.contactIcon} />
                <Text style={[styles.contactButtonText, { color: 'white' }]}>Contact Developer</Text>
            </TouchableOpacity>

            {/* Footer Text */}
            <Text style={styles.footerText}>© 2026 SPARE App</Text>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 40,
    },
    headerArea: {
        alignItems: 'center',
        marginVertical: 30,
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#00A3E0', // Using accent roughly
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    version: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 5,
    },
    card: {
        width: '100%',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.2)',
        paddingBottom: 5,
    },
    missionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureIcon: {
        marginRight: 10,
    },
    featureText: {
        fontSize: 15,
        flex: 1,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginTop: 10,
        width: '100%',
        elevation: 3,
    },
    contactIcon: {
        marginRight: 10,
    },
    contactButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        marginTop: 30,
        fontSize: 12,
        color: '#888',
    }
});
