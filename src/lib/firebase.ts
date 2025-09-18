
'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, type Database } from 'firebase/database';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyAv8BTWravcmLi4Yr2GHLCqiRmYK3C2p90",
  authDomain: "bpm-monitor-b93cd.firebaseapp.com",
  databaseURL: "https://bpm-monitor-b93cd-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bpm-monitor-b93cd",
  storageBucket: "bpm-monitor-b93cd.appspot.com",
  messagingSenderId: "229689202153",
  appId: "1:229689202153:web:8be53adfea19427fd5a778",
  measurementId: "G-4FYFPY5BZQ"
};

export const isConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.storageBucket &&
  !!firebaseConfig.databaseURL;

let app: FirebaseApp;
let auth: Auth;
let db: Database;
let storage: FirebaseStorage;

if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  auth = getAuth(app);
  db = getDatabase(app);
  storage = getStorage(app);

  // This is a critical guard. It ensures that we only try to connect to emulators
  // when the app is running on the actual localhost, and not in a cloud IDE.
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log("Connecting to Firebase emulators");
    // Point to the emulators running on your local machine
    connectDatabaseEmulator(db, '127.0.0.1', 9000);
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }

} else {
  console.error(
    'ACTION REQUIRED: Firebase client-side configuration is missing or incomplete. ' +
    'Please ensure all NEXT_PUBLIC_FIREBASE_* variables are set in your .env.local file. ' +
    'After creating/updating the file, you MUST restart the development server.'
  );
  // Provide dummy objects to prevent the app from crashing on import.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Database;
  storage = {} as FirebaseStorage;
}

export { app, auth, db, storage };
export default app;
