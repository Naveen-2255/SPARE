import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import fs from 'fs';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: "spare-88876.firebaseapp.com",
  projectId: "spare-88876",
  storageBucket: "spare-88876.firebasestorage.app",
  messagingSenderId: "296652979515",
  appId: "1:296652979515:web:9679c363869ca44c764b1e",
  measurementId: "G-6LCRRLYJQ7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function syncParts() {
  console.log("Fetching all shops (mechanics)...");
  const mechanicsSnap = await getDocs(collection(db, 'mechanics'));
  const shops = mechanicsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${shops.length} shops.`);

  if (shops.length === 0) {
    console.log("No shops found. Please add shops first.");
    process.exit(0);
  }

  console.log("Fetching existing parts in Firebase...");
  const partsSnap = await getDocs(collection(db, 'parts'));
  const existingParts = partsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`Found ${existingParts.length} parts currently in DB.`);

  // 1. DEDUPLICATE existing parts
  const seenSignatures = new Set();
  const partsToDelete = [];
  const validPartsSignatures = new Set();

  for (const part of existingParts) {
    // If part lacks shop_name, it's considered an orphan and removed to clean DB
    if (!part.shop_name) {
       partsToDelete.push(part.id);
       continue;
    }
    const sig = `${part.shop_name}::${part.name}::${part.bike_model}`;
    if (seenSignatures.has(sig)) {
      partsToDelete.push(part.id);
    } else {
      seenSignatures.add(sig);
      validPartsSignatures.add(sig);
    }
  }

  console.log(`Identified ${partsToDelete.length} duplicate/orphan parts to delete.`);
  
  if (partsToDelete.length > 0) {
    console.log("Deleting duplicates in batches...");
    let deleteBatch = writeBatch(db);
    let batchCount = 0;
    let totalDeleted = 0;
    for (const partId of partsToDelete) {
      deleteBatch.delete(doc(db, 'parts', partId));
      batchCount++;
      if (batchCount === 400) {
        await deleteBatch.commit();
        totalDeleted += batchCount;
        console.log(`Deleted ${totalDeleted}...`);
        deleteBatch = writeBatch(db);
        batchCount = 0;
      }
    }
    if (batchCount > 0) {
      await deleteBatch.commit();
      totalDeleted += batchCount;
    }
    console.log(`Finished deleting ${totalDeleted} parts.`);
  }

  // 2. ADD MISSING PARTS
  console.log("Reading all_bike_spare_parts.json...");
  let data;
  try {
    const raw = fs.readFileSync('./all_bike_spare_parts.json', 'utf8');
    data = JSON.parse(raw);
  } catch (err) {
    console.log("Could not read all_bike_spare_parts.json. Make sure you run this from the project root.");
    process.exit(1);
  }

  const allParts = data.spare_parts || [];
  console.log(`Loaded ${allParts.length} parts from JSON.`);

  console.log("Distributing parts to shops...");
  const partsToAdd = [];

  for (let i = 0; i < allParts.length; i++) {
    const part = allParts[i];
    
    // Assign to a shop in round-robin fashion to distribute the parts without exceeding Firebase limits
    const shopIndex = i % shops.length;
    const shop = shops[shopIndex];

    const sig = `${shop.name || 'Unknown'}::${part.name}::${part.bike_model}`;
    if (!validPartsSignatures.has(sig)) {
        partsToAdd.push({
            ...part,
            shop_name: shop.name || 'Unknown',
            shop_id: shop.id || '',
            owner_id: shop.owner_id || "",
            createdAt: new Date().toISOString()
        });
        validPartsSignatures.add(sig);
    }
  }

  console.log(`Identified ${partsToAdd.length} missing parts to add.`);

  if (partsToAdd.length > 0) {
    console.log(`Uploading missing parts in batches (this may take a moment)...`);
    let addBatch = writeBatch(db);
    let batchCount = 0;
    let totalAdded = 0;

    for (const p of partsToAdd) {
      const newDocRef = doc(collection(db, 'parts'));
      addBatch.set(newDocRef, p);
      batchCount++;

      if (batchCount === 400) {
        await addBatch.commit();
        totalAdded += batchCount;
        console.log(`Added ${totalAdded}...`);
        addBatch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await addBatch.commit();
      totalAdded += batchCount;
    }
    console.log(`Finished adding ${totalAdded} parts.`);
  }

  console.log("Sync complete! All duplicate parts removed, and missing parts uploaded.");
  process.exit(0);
}

syncParts().catch(console.error);
