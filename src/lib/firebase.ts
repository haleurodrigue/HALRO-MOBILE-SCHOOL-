import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDocFromServer, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoqqSkF8tGrXN5Ni8uqkbOhehtCGvNWXY",
  authDomain: "tenacious-synthesis-3g02f.firebaseapp.com",
  projectId: "tenacious-synthesis-3g02f",
  storageBucket: "tenacious-synthesis-3g02f.firebasestorage.app",
  messagingSenderId: "103597008115",
  appId: "1:103597008115:web:c4413dab2717d64a1e0386"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific custom database ID provided
export const db = initializeFirestore(app, {}, "ai-studio-44212a93-26af-4740-8544-74438a13810c");

// Validate Connection to Firestore on startup
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt to fetch a dummy document from server
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("🔥 Firebase Firestore connected successfully.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("⚠️ Firebase connection check: client is offline. Local storage fallback active.");
    } else {
      console.error("❌ Firebase connection error:", error);
    }
    return false;
  }
}
