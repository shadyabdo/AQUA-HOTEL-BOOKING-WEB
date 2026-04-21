import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkArticles() {
  try {
    console.log("Checking for Articles (uppercase)...");
    const snap1 = await getDocs(collection(db, "Articles"));
    console.log(`Found ${snap1.size} articles in 'Articles'.`);
    snap1.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });

    console.log("\nChecking for articles (lowercase)...");
    const snap2 = await getDocs(collection(db, "articles"));
    console.log(`Found ${snap2.size} articles in 'articles'.`);
    snap2.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

checkArticles();
