'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

// We will use a singleton pattern to ensure Firebase is initialized only once.
let firebaseServices: {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null = null;

// This flag ensures persistence is only enabled once.
let persistenceEnabled = false;

export function initializeFirebase() {
  // If already initialized, return the existing services.
  if (firebaseServices) {
    return firebaseServices;
  }

  // Initialize the Firebase App.
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  if (typeof window !== 'undefined') {
    // Pastikan process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY tersedia
    // Anda harus mengaturnya di file .env.local
    if (process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY) {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    } else {
      console.warn('Kunci situs reCAPTCHA Enterprise tidak ditemukan. App Check tidak diinisialisasi.');
    }
  }


  // Initialize Auth.
  const auth = getAuth(app);

  // Initialize Firestore.
  const firestore = getFirestore(app);

  // Attempt to enable persistence, but only once.
  if (!persistenceEnabled && typeof window !== 'undefined') {
    enableIndexedDbPersistence(firestore)
      .then(() => {
        // This will only be logged once in the entire app lifecycle.
        console.log("Firebase offline persistence enabled successfully.");
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore offline persistence could not be enabled, likely due to another tab being open.");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore offline persistence is not supported in this browser.");
        }
      });
    // Mark as attempted so we don't try again.
    persistenceEnabled = true;
  }

  // Store the initialized services in the singleton.
  firebaseServices = {
    firebaseApp: app,
    auth,
    firestore,
  };

  return firebaseServices;
}

// Export other necessary modules.
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';