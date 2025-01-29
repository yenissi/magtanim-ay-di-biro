import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";

// 🔹 Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOGKtqFQzWD9dazsJobG1ap8A55FdZewc",
  authDomain: "magtanim-database.firebaseapp.com",
  databaseURL: "https://magtanim-database-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "magtanim-database",
  storageBucket: "magtanim-database.firebasestorage.app",
  messagingSenderId: "233510096875",
  appId: "1:233510096875:web:0d88e8caa3cdafa5f513ae",
  measurementId: "G-6E998ZJKBX"
};

// 🔹 Initialize Firebase App
export const Firebase_App = initializeApp(firebaseConfig);

// 🔹 Initialize Firebase Auth with AsyncStorage
export const Firebase_Auth =
  getAuth().app ? getAuth() : initializeAuth(Firebase_App, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

// 🔹 Initialize Firebase Realtime Database
export const Firebase_Database = getDatabase(Firebase_App);
