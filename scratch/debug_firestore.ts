import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, collectionGroup } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugData() {
  console.log("--- Debugging Firestore Data ---");
  
  // 1. Check Cities
  try {
    const citiesSnap = await getDocs(collection(db, "cities"));
    console.log(`Found ${citiesSnap.size} cities`);
    citiesSnap.docs.forEach(doc => {
        console.log(`City: ${doc.id} - ${doc.data().name}`);
    });
  } catch (e) { console.error("Error fetching cities:", e); }

  // 2. Check Hotels (Collection Group)
  try {
    const hotelsSnap = await getDocs(collectionGroup(db, "hotels"));
    console.log(`Found ${hotelsSnap.size} hotels (Collection Group)`);
    hotelsSnap.docs.slice(0, 3).forEach(doc => {
        console.log(`Hotel: ${doc.id} - ${doc.data().name} (Path: ${doc.ref.path})`);
    });
  } catch (e) { console.error("Error fetching hotels CG:", e); }

  // 3. Check Rooms (Collection Group)
  try {
    const roomsSnap = await getDocs(collectionGroup(db, "rooms"));
    console.log(`Found ${roomsSnap.size} rooms (Collection Group)`);
    roomsSnap.docs.slice(0, 3).forEach(doc => {
        console.log(`Room: ${doc.id} - ${doc.data().title || doc.data().Room_name} (Path: ${doc.ref.path})`);
    });
  } catch (e) { console.error("Error fetching rooms CG:", e); }

  console.log("--- End Debug ---");
}

debugData();
