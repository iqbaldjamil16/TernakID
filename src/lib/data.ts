'use client';

import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  onSnapshot,
  runTransaction,
  query,
  limit,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Livestock, HealthLog, ReproductionLog, GrowthRecord } from '@/lib/types';

const LIVESTOCK_COLLECTION = 'livestock';

const generateDefaultData = (idNumber: number): Omit<Livestock, 'id'> => {
  const birthDate = new Date(2023, 0, 1 + (idNumber % 30));
  birthDate.setFullYear(birthDate.getFullYear() - (idNumber % 5));

  return {
    name: `Ternak ${idNumber}`,
    regId: `KIT-${String(idNumber).padStart(3, '0')}`,
    photoUrl: `https://picsum.photos/seed/animal${idNumber}/400/400`,
    breed: (idNumber % 3 === 0) ? "Sapi Bali" : (idNumber % 3 === 1) ? "Sapi Ongole" : "Simental",
    gender: (idNumber % 2 === 0) ? "Jantan" : "Betina",
    status: (idNumber % 10 === 0) ? "Dijual" : "Produktif",
    owner: "Peternakan Umum",
    address: `Kandang Umum, Desa Makmur`,
    birthDate: birthDate,
    healthLog: [],
    reproductionLog: [],
    growthRecords: [
      { date: birthDate, weight: 30 + (idNumber % 10) },
      { date: new Date(birthDate.getTime() + 180 * 24 * 3600 * 1000), weight: 150 + (idNumber % 50) },
    ],
    pedigree: {
      dam: { name: `Induk-${1000 + idNumber}`, regId: `IND-${1000 + idNumber}`, breed: "Sapi Bali", offspring: 2 },
      sire: { name: `Pejantan-${2000 + idNumber}`, semenId: `PJT-${2000 + idNumber}`, breed: "Simental", characteristics: "Postur tinggi" },
    }
  };
};

export async function createDefaultAnimals(count = 100) {
  const { firestore } = initializeFirebase();
  try {
    const livestockCollectionRef = collection(firestore, LIVESTOCK_COLLECTION);
    const q = query(livestockCollectionRef, limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log('Database already has livestock data. Skipping creation.');
      return;
    }

    console.log('No livestock data found. Creating default set...');
    const batch = writeBatch(firestore);
    for (let i = 1; i <= count; i++) {
      const docId = `KIT-${String(i).padStart(3, '0')}`;
      const docRef = doc(firestore, LIVESTOCK_COLLECTION, docId);
      const animalData = generateDefaultData(i);
      batch.set(docRef, { ...animalData, id: docId });
    }
    await batch.commit();
    console.log(`${count} default animals created successfully.`);
  } catch (error) {
    console.error("Error creating default animals:", error);
    // Propagate a generic permission error if something fails during write.
    const permissionError = new FirestorePermissionError({
      path: LIVESTOCK_COLLECTION,
      operation: 'create',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export function listenToAnimals(callback: (animals: Livestock[]) => void): () => void {
  const { firestore } = initializeFirebase();
  const livestockCollectionRef = collection(firestore, LIVESTOCK_COLLECTION);
  const unsubscribe = onSnapshot(livestockCollectionRef, (snapshot) => {
    const animals = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            birthDate: data.birthDate?.toDate ? data.birthDate.toDate() : new Date(data.birthDate),
            healthLog: (data.healthLog || []).map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
            reproductionLog: (data.reproductionLog || []).map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
            growthRecords: (data.growthRecords || []).map((rec: any) => ({...rec, date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date)})),
        } as Livestock;
    });
    callback(animals);
  }, (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: livestockCollectionRef.path,
        operation: 'list',
      });
      console.error(permissionError.message);
      errorEmitter.emit('permission-error', permissionError);
  });
  return unsubscribe;
}

export const updateAnimal = async (id: string, updatedData: Partial<Omit<Livestock, 'id'>>): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, id);
  return setDoc(docRef, updatedData, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updatedData,
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

export const updateAnimalPhoto = async (id: string, photoUrl: string): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, id);
  const updatedData = { photoUrl };
  return updateDoc(docRef, updatedData).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updatedData,
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

export const addHealthLog = async (animalId: string, log: HealthLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    await updateDoc(docRef, { healthLog: arrayUnion(log) });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { healthLog: [log] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};


export const updateHealthLog = async (animalId: string, updatedLog: HealthLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    await runTransaction(firestore, async (transaction) => {
      const animalDoc = await transaction.get(docRef);
      if (!animalDoc.exists()) {
        throw "Document does not exist!";
      }
      const currentLogs: HealthLog[] = (animalDoc.data().healthLog || []).map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)}));
      const logIndex = currentLogs.findIndex(log => log.id === updatedLog.id);
      if (logIndex === -1) {
        currentLogs.push(updatedLog);
      } else {
        currentLogs[logIndex] = updatedLog;
      }
      transaction.update(docRef, { healthLog: currentLogs });
    });
  } catch (e) {
     const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { healthLog: [updatedLog] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const deleteHealthLog = async (animalId: string, logToDelete: HealthLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    await runTransaction(firestore, async (transaction) => {
        const animalDoc = await transaction.get(docRef);
        if (!animalDoc.exists()) {
            throw "Document does not exist!";
        }
        const currentLogs: HealthLog[] = animalDoc.data().healthLog || [];
        const logsToKeep = currentLogs.filter(log => log.id !== logToDelete.id);
        transaction.update(docRef, { healthLog: logsToKeep });
    });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { healthLog: [] }, // Approximation for the error log
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const addReproductionLog = async (animalId: string, log: ReproductionLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
     await updateDoc(docRef, { reproductionLog: arrayUnion(log) });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { reproductionLog: [log] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const addGrowthRecord = async (animalId: string, record: GrowthRecord): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    await updateDoc(docRef, { growthRecords: arrayUnion(record) });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { growthRecords: [record] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};
