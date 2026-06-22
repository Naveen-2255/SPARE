import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5TF1gPQ8DXafNT1p4YOQiHWalAhS-n00",
  authDomain: "spare-88876.firebaseapp.com",
  projectId: "spare-88876",
  storageBucket: "spare-88876.firebasestorage.app",
  messagingSenderId: "296652979515",
  appId: "1:296652979515:web:9679c363869ca44c764b1e",
  measurementId: "G-6LCRRLYJQ7"
};

const app = initializeApp(firebaseConfig);

// Correct for React Native Persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Simple Firestore initialization
export const db = getFirestore(app);
export const seedDatabase = async () => {
  try {
    // Seed Parts Collection (5 dummy parts)
    const partsData = [
      {
        name: "Brake Pad Set - Front",
        price: 450,
        bike_model: "Royal Enfield Classic 350",
        shop_name: "Bangalore Auto Parts",
        in_stock: true,
        video_id: "dQw4w9WgXcQ"
      },
      {
        name: "Engine Oil Filter",
        price: 180,
        bike_model: "Bajaj Pulsar 150",
        shop_name: "City Motor Works",
        in_stock: true,
        video_id: "dQw4w9WgXcQ"
      },
      {
        name: "Chain Sprocket Kit",
        price: 1200,
        bike_model: "Yamaha FZ",
        shop_name: "Speed Motors",
        in_stock: false,
        video_id: "dQw4w9WgXcQ"
      },
      {
        name: "Clutch Cable",
        price: 250,
        bike_model: "Honda CB Shine",
        shop_name: "Bangalore Auto Parts",
        in_stock: true,
        video_id: "dQw4w9WgXcQ"
      },
      {
        name: "Headlight Bulb - LED",
        price: 350,
        bike_model: "TVS Apache RTR",
        shop_name: "City Motor Works",
        in_stock: true,
        video_id: "dQw4w9WgXcQ"
      }
    ];

    // Seed Mechanics Collection (3 dummy mechanics)
    const mechanicsData = [
      {
        name: "Rajesh Auto Service",
        phone: "+91 98765 43210",
        latitude: 12.9716,
        longitude: 77.5946
      },
      {
        name: "Kumar Bike Repair",
        phone: "+91 98765 43211",
        latitude: 12.9352,
        longitude: 77.6245
      },
      {
        name: "Bangalore Motor Works",
        phone: "+91 98765 43212",
        latitude: 12.9724,
        longitude: 77.6093
      }
    ];

    // Add parts to Firestore
    console.log('Adding parts to database...');
    for (const part of partsData) {
      const docRef = await addDoc(collection(db, 'parts'), part);
      console.log(`Part added with ID: ${docRef.id}`);
    }

    // Add mechanics to Firestore
    console.log('Adding mechanics to database...');
    for (const mechanic of mechanicsData) {
      const docRef = await addDoc(collection(db, 'mechanics'), mechanic);
      console.log(`Mechanic added with ID: ${docRef.id}`);
    }

    console.log('Database seeding completed successfully!');
    return { success: true, message: 'Database seeded successfully' };
  } catch (error) {
    console.error('Error seeding database:', error);
    return { success: false, error: error.message };
  }
};

export { app };
