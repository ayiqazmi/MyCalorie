// config/firebase-config.js

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyBvc4-Eu2XbzAfvUR-ly4oEVxqcxTNbr9M',
  authDomain: 'my-calorie-fyp.firebaseapp.com',
  projectId: 'my-calorie-fyp',
  storageBucket: 'my-calorie-fyp.appspot.com',
  messagingSenderId: '952183755976',
  appId: '1:952183755976:web:9ce913600aa79cf71501fd',
  measurementId: 'G-NPDB29MLL1',
};

// Prevent re-initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Fix for React Native Auth (with persistence)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { app, auth, db };
