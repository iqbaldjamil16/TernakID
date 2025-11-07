'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
// This is a singleton that will be executed only once.
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebaseApp() {
    if (getApps().length) {
        return getApp();
    }
    
    // Important! initializeApp() is called without any arguments because Firebase App Hosting
    // integrates with the initializeApp() function to provide the environment variables needed to
    // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
    // without arguments.
    try {
        // Attempt to initialize via Firebase App Hosting environment variables
        return initializeApp();
    } catch (e) {
        // Only warn in production because it's normal to use the firebaseConfig to initialize
        // during development
        if (process.env.NODE_ENV === "production") {
            console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
        }
        return initializeApp(firebaseConfig);
    }
}


// Keep track if persistence has been enabled, to avoid re-enabling
let persistenceEnabled = false;

// This function is the single entry point for all firebase services
export function initializeFirebase() {
    if (firebaseApp) {
        return { firebaseApp, auth, firestore };
    }

    firebaseApp = initializeFirebaseApp();

    // We initialize firestore with settings, which must be done before any other firestore call.
    // This is the core of the fix.
    firestore = initializeFirestore(firebaseApp, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });
    auth = getAuth(firebaseApp);
    
    if (!persistenceEnabled) {
        enableIndexedDbPersistence(firestore).then(() => {
             persistenceEnabled = true;
             console.log("Firebase offline persistence enabled.");
        }).catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn("Firestore offline persistence could not be enabled, likely due to another tab being open.");
            } else if (err.code == 'unimplemented') {
                console.warn("Firestore offline persistence is not supported in this browser.");
            }
             persistenceEnabled = true; // Mark as "handled" to prevent retries
        });
    }
    
    return {
        firebaseApp,
        auth,
        firestore
    };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';