// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDOGKtqFQzWD9dazsJobG1ap8A55FdZewc",
  authDomain: "magtanim-database.firebaseapp.com",
  databaseURL: "https://magtanim-database-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "magtanim-database",
  storageBucket: "magtanim-database.appspot.com",
  messagingSenderId: "233510096875",
  appId: "1:233510096875:web:0d88e8caa3cdafa5f513ae",
  measurementId: "G-6E998ZJKBX"
};

const Firebase_App = initializeApp(firebaseConfig);

const Firebase_Auth =
  getAuth().app ? getAuth() : initializeAuth(Firebase_App, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

const Firebase_Database = getDatabase(Firebase_App);

export { Firebase_App, Firebase_Auth, Firebase_Database };