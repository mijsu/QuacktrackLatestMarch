import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTEQN783wDkZvx0m_t-3PB-zPyxRbSBx0",
  authDomain: "quacktrack-d589c.firebaseapp.com",
  projectId: "quacktrack-d589c",
  storageBucket: "quacktrack-d589c.firebasestorage.app",
  messagingSenderId: "1024941469627",
  appId: "1:1024941469627:web:a81885b0cc47bfe7d3de9e"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { db };
