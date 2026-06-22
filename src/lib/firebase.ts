/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

// Injected config from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCYjHZmhuimRUbYx_0irTESTNGWDZAA9_Q",
  authDomain: "gen-lang-client-0854295575.firebaseapp.com",
  projectId: "gen-lang-client-0854295575",
  storageBucket: "gen-lang-client-0854295575.firebasestorage.app",
  messagingSenderId: "509296802327",
  appId: "1:509296802327:web:9d600674e8295858d53a52"
};

const databaseId = "ai-studio-67b637ec-3946-4820-bbf9-043692250cb1";

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore specifically using the provisioned databaseId
const db = initializeFirestore(app, {}, databaseId);

export { app, db };
