'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let persistenceEnabled = false;

function initializeFirebaseApp() {
    if (firebaseApp) return firebaseApp;

    if (getApps().length > 0) {
        firebaseApp = getApp();
    } else {
        try {
            // This will throw if the config is not available from the environment.
            firebaseApp = initializeApp();
        } catch (e) {
            if (process.env.NODE_ENV === "production") {
                console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
            }
            firebaseApp = initializeApp(firebaseConfig);
        }
    }
    return firebaseApp;
}

export function initializeFirebase() {
    if (firestore && auth && firebaseApp) {
        return { firebaseApp, auth, firestore };
    }

    const app = initializeFirebaseApp();
    
    // Initialize Firestore with persistence settings.
    // This must be done before any other Firestore operations.
    if (!firestore) {
       let db = getFirestore(app);
       if (!persistenceEnabled) {
         enableIndexedDbPersistence(db)
            .then(() => {
                persistenceEnabled = true;
                console.log("Firebase offline persistence enabled.");
            })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn("Firestore offline persistence could not be enabled, likely due to another tab being open.");
                } else if (err.code === 'unimplemented') {
                    console.warn("Firestore offline persistence is not supported in this browser.");
                }
                // Mark as enabled to avoid retrying in the same session
                persistenceEnabled = true;
            });
       }
       firestore = db;
    }

    if (!auth) {
        auth = getAuth(app);
    }
    
    return { firebaseApp: app, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
