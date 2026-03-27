import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

const PartDetailScreen = ({ route }) => {
  const items = route?.params?.items || [];
  const partId = route?.params?.partId;
  
  // Find the part by ID
  const part = items.find((p) => p.id === partId);


  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.partName}>{part.name}</Text>
          <View
            style={[
              styles.stockBadge,
              part.in_stock ? styles.stockBadgeGreen : styles.stockBadgeRed,
            ]}
          >
            <Text style={styles.stockText}>
              {part.in_stock ? 'In Stock' : 'Out of Stock'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bike Model</Text>
          <Text style={styles.value}>{part.bike_model}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.price}>₹{part.price}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Shop Name</Text>
          <Text style={styles.value}>{part.shop_name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Stock Status</Text>
          <Text style={styles.value}>
            {part.in_stock ? 'Available' : 'Currently Unavailable'}
          </Text>
        </View>

        {part.video_id && (
          <View style={styles.videoSection}>
            <Text style={styles.label}>How to Install</Text>
            <View style={styles.videoContainer}>
              <YoutubePlayer
                height={220}
                videoId={part.video_id}
                play={false}
                controls={true}
                showFullScreenButton={true}
              />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  partName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  stockBadgeGreen: {
    backgroundColor: '#4CAF50',
  },
  stockBadgeRed: {
    backgroundColor: '#F44336',
  },
  stockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00A3E0',
  },
  videoSection: {
    marginBottom: 20,
    paddingBottom: 16,
  },
  videoContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});

export default PartDetailScreen;
