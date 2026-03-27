
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
// Hardcoded Video Data (Or fetch from DB)
const VIDEO_DATA = [
  { id: '1', title: 'Royal Enfield Oil Change', bike: 'Royal Enfield', videoId: 'pxa3iOAUpAY' },
  { id: '2', title: 'Splendor Headlight Fix', bike: 'Hero Splendor', videoId: 'rldq2xsv4uM' },
  { id: '3', title: 'Activa Battery Replace', bike: 'Honda Activa', videoId: 'Wzjj1oGMgwY' },
  { id: '4', title: 'Pulsar Chain Adjustment', bike: 'Bajaj Pulsar', videoId: 'UE4zvP3hPrU' },
  { id: '5', title: 'Bike Chain Cleaning & Lubrication', bike: 'All Bikes', videoId: 'VnPYdcbcAe0' },

  { id: '6', title: 'Motorcycle Brake Pad Replacement', bike: 'All Bikes', videoId: 'QiqT44lFtww' },
  { id: '7', title: 'How To Change Motorcycle Spark Plug', bike: 'All Bikes', videoId: '52UmlOGAjK8' },
  { id: '8', title: 'Motorcycle Clutch Adjustment', bike: 'All Bikes', videoId: '8MW4h1Rk9AA' },
  { id: '9', title: 'Bike Air Filter Cleaning', bike: 'All Bikes', videoId: '380av2zWQZM' },
  { id: '10', title: 'How To Wash A Motorcycle Properly', bike: 'All Bikes', videoId: 'eIXDDj1MSLE' },

  { id: '11', title: 'Disc Brake Bleeding Tutorial', bike: 'All Bikes', videoId: 'fUWO0SQX6-U' },
  { id: '12', title: 'Motorcycle Battery Maintenance', bike: 'All Bikes', videoId: 'OiYzmVhgm2s' },

  { id: '13', title: 'How To Adjust Bike Carburetor', bike: 'Carburetor Bikes', videoId: 'p44VNddZ7Zc' },
  { id: '14', title: 'Tubeless Tyre Puncture Repair', bike: 'All Bikes', videoId: '_ocVkYAAaVg' },
  { id: '15', title: 'Motorcycle Coolant Change', bike: 'Liquid Cooled Bikes', videoId: 'z_OSEABct-Y' },

  { id: '16', title: 'Bike Indicator Wiring Fix', bike: 'All Bikes', videoId: 'uDAm7y1g-yI' },
  { id: '17', title: 'Throttle Cable Replacement', bike: 'All Bikes', videoId: 'I_YTG1x9oZ8' },
  { id: '18', title: 'Front Fork Oil Change', bike: 'All Bikes', videoId: '_wG9JJv9614' },
  { id: '19', title: 'Chain Sprocket Replacement', bike: 'All Bikes', videoId: 'I7r92oEav6Q' },
  { id: '20', title: 'Motorcycle Engine Oil Filter Change', bike: 'All Bikes', videoId: 'Q8cl3bFPgxo' },

  { id: '21', title: 'Honda Activa CVT Cleaning', bike: 'Honda Activa', videoId: 'uIfYJQtz8zA' },
  { id: '22', title: 'Pulsar Brake Cable Adjustment', bike: 'Bajaj Pulsar', videoId: 'M4aW5mQ7_Ko' },
  { id: '23', title: 'Royal Enfield Chain Tension Setting', bike: 'Royal Enfield', videoId: 'fMLXhJpfohI' },
  { id: '24', title: 'Bike Self Start Motor Fix', bike: 'All Bikes', videoId: 'zHRDmy8ArfI' },
  { id: '25', title: 'Motorcycle Electrical Troubleshooting', bike: 'All Bikes', videoId: 'Zl354AHOFlo' },


];

export default function VideoHubScreen() {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [videos, setVideos] = useState(VIDEO_DATA);

  const handleSearch = (text) => {
    setSearch(text);
    const filtered = VIDEO_DATA.filter(v =>
      v.title.toLowerCase().includes(text.toLowerCase()) ||
      v.bike.toLowerCase().includes(text.toLowerCase())
    );
    setVideos(filtered);
  };

  const openVideo = (id) => {
    // Opens YouTube App directly
    Linking.openURL(`https://www.youtube.com/watch?v=${id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.header, { color: theme.text }]}>DIY Service Hub 🛠️</Text>
      <TextInput
        style={[styles.search, { backgroundColor: theme.card, color: theme.text }]}
        placeholder="Search Bike (e.g. Splendor)..."
        placeholderTextColor="gray"
        value={search}
        onChangeText={handleSearch}
      />

      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, { backgroundColor: theme.card }]} onPress={() => openVideo(item.videoId)}>
            {/* YouTube Thumbnail Trick */}
            <Image
              source={{ uri: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` }}
              style={styles.thumbnail}
            />
            <View style={styles.info}>
              <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
              <Text style={styles.bike}>{item.bike}</Text>
              <View style={styles.playBtn}>
                <Ionicons name="play-circle" size={24} color="#00A3E0" />
                <Text style={{ color: '#00A3E0', fontWeight: 'bold' }}> Watch Now</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#F4F6F8' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  search: { backgroundColor: 'white', padding: 12, borderRadius: 8, marginBottom: 15, elevation: 2 },
  card: { backgroundColor: 'white', borderRadius: 10, marginBottom: 15, overflow: 'hidden', elevation: 3 },
  thumbnail: { width: '100%', height: 180 },
  info: { padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold' },
  bike: { color: 'gray', marginBottom: 10 },
  playBtn: { flexDirection: 'row', alignItems: 'center' }
});
