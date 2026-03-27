import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, FlatList, ScrollView,
    TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Linking, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import { collection, addDoc, query, onSnapshot, orderBy, serverTimestamp, getDocs, where, limit } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

export default function ShopProfileScreen({ route, navigation }) {
    const shopData = route.params?.shopData;
    const { theme } = useTheme();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);

    // Inventory state
    const [inventoryPreview, setInventoryPreview] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(true);

    useEffect(() => {
        if (navigation && shopData) {
            navigation.setOptions({
                title: shopData.name || 'Shop Profile'
            });
        }
    }, [navigation, shopData]);

    useEffect(() => {
        if (!shopData || !shopData.id) {
            // If we don't have a shop ID, load dummy reviews for show
            setReviews([
                { id: '1', userName: 'John Doe', rating: 5, text: 'Great service! Fixed my bike fast.', createdAt: new Date() },
                { id: '2', userName: 'Alex Smith', rating: 4, text: 'Very professional, recommended.', createdAt: new Date() }
            ]);
            setLoading(false);
            return;
        }

        const reviewsRef = collection(db, 'mechanics', shopData.id, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedReviews = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Handle serverTimestamp which might be null initially
                createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
            }));

            // If no real reviews exist yet, show some dummy ones to fill the UI
            if (fetchedReviews.length === 0) {
                setReviews([
                    { id: 'dummy1', userName: 'John Doe', rating: 5, text: 'Great service! Fixed my bike fast.', createdAt: new Date() },
                    { id: 'dummy2', userName: 'Alex Smith', rating: 4, text: 'Very professional, recommended.', createdAt: new Date() }
                ]);
            } else {
                setReviews(fetchedReviews);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reviews", error);
            setLoading(false);
        });

        return unsubscribe;
    }, [shopData]);

    // Fetch Inventory Preview
    useEffect(() => {
        const fetchInventory = async () => {
            if (!shopData || !shopData.name) {
                setLoadingInventory(false);
                return;
            }
            try {
                const q = query(
                    collection(db, "parts"),
                    where("shop_name", "==", shopData.name),
                    limit(3)
                );
                const querySnapshot = await getDocs(q);
                const parts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInventoryPreview(parts);
            } catch (error) {
                console.error("Error fetching inventory preview for shop:", error);
            } finally {
                setLoadingInventory(false);
            }
        };

        fetchInventory();
    }, [shopData]);

    const submitReview = async () => {
        if (!reviewText.trim()) {
            Alert.alert('Error', 'Please enter a review');
            return;
        }

        if (!shopData.id) {
            Alert.alert('Error', 'Cannot submit review: Shop ID is missing.');
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            Alert.alert('Auth Required', 'You must be logged in to leave a review.');
            return;
        }

        setSubmitting(true);
        try {
            const reviewsRef = collection(db, 'mechanics', shopData.id, 'reviews');
            await addDoc(reviewsRef, {
                userId: user.uid,
                userName: user.displayName || user.email?.split('@')[0] || 'Anonymous User',
                rating,
                text: reviewText.trim(),
                createdAt: serverTimestamp()
            });

            setReviewText('');
            setRating(5);
            setModalVisible(false);
            Alert.alert('Success', 'Thank you for your review!');
        } catch (error) {
            console.error("Error submitting review:", error);
            Alert.alert('Error', 'Could not submit your review. Please try again.');
        }
        setSubmitting(false);
    };

    const renderStars = (count, size = 16) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Ionicons
                    key={i}
                    name={i <= count ? "star" : "star-outline"}
                    size={size}
                    color="#FFD700"
                />
            );
        }
        return <View style={{ flexDirection: 'row' }}>{stars}</View>;
    };

    const renderReview = ({ item }) => (
        <View style={[styles.reviewCard, { backgroundColor: theme.card }]}>
            <View style={styles.reviewHeader}>
                <Ionicons name="person-circle" size={30} color={theme.text} />
                <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.reviewerName, { color: theme.text }]}>{item.userName}</Text>
                    {renderStars(item.rating)}
                </View>
            </View>
            <Text style={[styles.reviewText, { color: theme.text }]}>{item.text}</Text>
        </View>
    );

    const handleCall = () => {
        if (shopData.phone) {
            Linking.openURL(`tel:${shopData.phone}`);
        } else {
            alert("No phone number available for this shop.");
        }
    };

    const handleNavigate = () => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${shopData.latitude},${shopData.longitude}`;
        const label = shopData.name;
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });
        Linking.openURL(url).catch(() => {
            alert("Failed to open maps.");
        });
    };

    if (!shopData) {
        return (
            <View style={[styles.container, { backgroundColor: '#1B3A57', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: 'white', fontSize: 20, marginBottom: 20, fontWeight: 'bold' }}>Shop details not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#34C759', borderRadius: 8 }}>
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <FlatList
                data={loading ? [] : reviews}
                keyExtractor={item => item.id}
                renderItem={renderReview}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListHeaderComponent={
                    <>
                        <View style={styles.content}>
                            {/* Shop Info Section */}
                            <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
                                <Text style={[styles.shopName, { color: theme.text }]}>{shopData.name}</Text>
                                <View style={styles.infoRow}>
                                    <Ionicons name="call" size={18} color="#1B3A57" />
                                    <Text style={[styles.infoText, { color: theme.text }]}>{shopData.phone || 'Phone not listed'}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="time" size={18} color="#1B3A57" />
                                    <Text style={[styles.infoText, { color: theme.text }]}>
                                        {shopData.openTime || '9:00 AM'} - {shopData.closeTime || '9:00 PM'}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="location" size={18} color="#1B3A57" />
                                    <Text style={[styles.infoText, { color: theme.text }]}>Lat: {shopData.latitude}, Lng: {shopData.longitude}</Text>
                                </View>

                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>
                                        {shopData.status || 'Open'}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons Section */}
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1B3A57' }]} onPress={handleCall}>
                                    <Ionicons name="call" size={20} color="white" />
                                    <Text style={styles.actionBtnText}>Call Shop</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#1B3A57' }]} onPress={handleNavigate}>
                                    <Ionicons name="navigate" size={20} color="white" />
                                    <Text style={styles.actionBtnText}>Navigate</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Inventory Preview Section */}
                            <View style={styles.inventorySection}>
                                <View style={styles.inventoryHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Inventory Preview</Text>
                                </View>

                                {loadingInventory ? (
                                    <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 20 }} />
                                ) : inventoryPreview.length === 0 ? (
                                    <Text style={{ color: 'gray', marginTop: 10, textAlign: 'center' }}>No inventory listed for this shop yet.</Text>
                                ) : (
                                    <View style={styles.inventoryList}>
                                        {inventoryPreview.map(item => (
                                            <View key={item.id} style={[styles.partCard, { backgroundColor: theme.card }]}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.partName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                                    <Text style={{ color: 'gray', fontSize: 13 }} numberOfLines={1}>{item.bike_model}</Text>
                                                    <Text style={{ fontWeight: 'bold', color: '#007AFF', marginTop: 5 }}>₹{item.price}</Text>
                                                </View>
                                                <View style={{ justifyContent: 'center', marginLeft: 10 }}>
                                                    {item.in_stock ? (
                                                        <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                                                    ) : (
                                                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Reviews Section */}
                            <View style={styles.reviewsSection}>
                                <View style={styles.reviewsHeader}>
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer Reviews</Text>
                                    <TouchableOpacity
                                        style={[styles.writeReviewBtn, { backgroundColor: theme.primary }]}
                                        onPress={() => setModalVisible(true)}
                                    >
                                        <Text style={styles.writeReviewText}>Write a Review</Text>
                                    </TouchableOpacity>
                                </View>

                                {loading && (
                                    <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
                                )}
                            </View>
                        </View>
                    </>
                }
            />

            {/* Write Review Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Write a Review</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalLabel, { color: theme.text }]}>Rating</Text>
                        <View style={styles.starSelector}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                    <Ionicons
                                        name={star <= rating ? "star" : "star-outline"}
                                        size={36}
                                        color="#FFD700"
                                        style={{ marginHorizontal: 5 }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.textInput, { color: theme.text, borderColor: theme.text }]}
                            placeholder="Share your experience..."
                            placeholderTextColor="gray"
                            multiline
                            numberOfLines={4}
                            value={reviewText}
                            onChangeText={setReviewText}
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, { backgroundColor: theme.primary }]}
                            onPress={submitReview}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit Review</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    content: {
        flex: 1,
        padding: 15,
        paddingBottom: 40,
    },
    infoCard: {
        borderRadius: 12,
        padding: 15,
        marginTop: -40,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    shopName: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 14,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#4CAF50'
    },
    statusText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 12,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        marginHorizontal: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    actionBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    inventorySection: {
        marginTop: 25,
    },
    inventoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    inventoryList: {
        gap: 10,
    },
    partCard: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    partName: {
        fontSize: 16,
        fontWeight: '600',
    },
    reviewsSection: {
        flex: 1,
        marginTop: 20,
    },
    reviewsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    writeReviewBtn: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    writeReviewText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 12,
    },
    reviewCard: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerName: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    reviewText: {
        fontSize: 14,
        lineHeight: 20,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        borderRadius: 15,
        padding: 20,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    starSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    submitBtn: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
