'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, terminate } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    let firebaseApp;
    try {
      // Attempt to initialize via Firebase App Hosting environment variables
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn in production because it's normal to use the firebaseConfig to initialize
      // during development
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

// Keep track if persistence has been enabled, to avoid re-enabling
let persistenceEnabled = false;

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  
  if (!persistenceEnabled) {
      try {
        enableIndexedDbPersistence(firestore)
          .then(() => {
            console.log("Firebase offline persistence enabled.");
            persistenceEnabled = true;
          })
          .catch((err) => {
            if (err.code == 'failed-precondition') {
              // Multiple tabs open, persistence can only be enabled in one.
              // This is a normal scenario.
              console.warn("Firestore offline persistence could not be enabled, likely due to another tab being open.");
            } else if (err.code == 'unimplemented') {
              // The current browser does not support all of the
              // features required to enable persistence
               console.warn("Firestore offline persistence is not supported in this browser.");
            }
            persistenceEnabled = true; // Mark as "handled" to prevent retries
          });
      } catch (e) {
        console.error("Error enabling Firestore persistence:", e);
        persistenceEnabled = true; // Mark as "handled"
      }
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';