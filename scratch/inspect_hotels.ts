import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, collectionGroup } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkHotels() {
  try {
    console.log("Checking cities...");
    const cities = await getDocs(collection(db, 'cities'));
    console.log(`Found ${cities.size} cities.`);
    
    let totalHotelsNested = 0;
    for (const cityDoc of cities.docs) {
      const hotelsSnapshot = await getDocs(collection(db, 'cities', cityDoc.id, 'hotels'));
      totalHotelsNested += hotelsSnapshot.size;
    }
    console.log(`Found ${totalHotelsNested} hotels via nested path.`);
    
    console.log("\nChecking collectionGroup('hotels')...");
    const hotelsGroup = await getDocs(collectionGroup(db, 'hotels'));
    console.log(`Found ${hotelsGroup.size} hotels via collectionGroup.`);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkHotels();
