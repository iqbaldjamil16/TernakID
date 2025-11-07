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
  arrayRemove,
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
    healthLog: [
      { id: `hl_${birthDate.getTime()}`, date: new Date(birthDate.getTime() + 30 * 24 * 3600 * 1000), type: 'Vaksinasi', detail: 'Vaksin PMK', notes: 'Dosis pertama' },
    ],
    reproductionLog: [
       { id: `rl_${birthDate.getTime()}`, date: new Date(birthDate.getTime() + 730 * 24 * 3600 * 1000), type: 'Inseminasi Buatan (IB)', detail: 'Semen ID: BX-01', notes: 'IB pertama' },
    ],
    growthRecords: [
      { id: `gr_${birthDate.getTime()}`, date: birthDate, weight: 30 + (idNumber % 10) },
      { id: `gr_${birthDate.getTime() + 1}`, date: new Date(birthDate.getTime() + 180 * 24 * 3600 * 1000), weight: 150 + (idNumber % 50) },
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
            healthLog: (data.healthLog || []).map((log: any) => ({...log, id: log.id || `hl_${log.date.seconds}`, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
            reproductionLog: (data.reproductionLog || []).map((log: any) => ({...log, id: log.id || `rl_${log.date.seconds}`, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
            growthRecords: (data.growthRecords || []).map((rec: any) => ({...rec, id: rec.id || `gr_${rec.date.seconds}`, date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date)})),
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

export const addHealthLog = async (animalId: string, log: Omit<HealthLog, 'id'>): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  const newLog = { ...log, id: `hl_${Date.now()}` };
  try {
    await updateDoc(docRef, { healthLog: arrayUnion(newLog) });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { healthLog: [newLog] },
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
        throw `Log with id ${updatedLog.id} not found.`;
      }
      currentLogs[logIndex] = updatedLog;
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
     await updateDoc(docRef, { healthLog: arrayRemove(logToDelete) });
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

export const addReproductionLog = async (animalId: string, log: Omit<ReproductionLog, 'id'>): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  const newLog = { ...log, id: `rl_${Date.now()}` };
  try {
     await updateDoc(docRef, { reproductionLog: arrayUnion(newLog) });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { reproductionLog: [newLog] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const updateReproductionLog = async (animalId: string, updatedLog: ReproductionLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    await runTransaction(firestore, async (transaction) => {
      const animalDoc = await transaction.get(docRef);
      if (!animalDoc.exists()) {
        throw "Document does not exist!";
      }
      const currentLogs: ReproductionLog[] = (animalDoc.data().reproductionLog || []).map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)}));
      const logIndex = currentLogs.findIndex(log => log.id === updatedLog.id);
      if (logIndex === -1) {
        throw `Log with id ${updatedLog.id} not found.`;
      }
      currentLogs[logIndex] = updatedLog;
      transaction.update(docRef, { reproductionLog: currentLogs });
    });
  } catch (e) {
     const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { reproductionLog: [updatedLog] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const deleteReproductionLog = async (animalId: string, logToDelete: ReproductionLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    await updateDoc(docRef, { reproductionLog: arrayRemove(logToDelete) });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { reproductionLog: [] }, // Approximation for the error log
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};


export const addGrowthRecord = async (animalId: string, record: Omit<GrowthRecord, 'id' | 'adg'>): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  const newRecord = { ...record, id: `gr_${Date.now()}` };
  try {
    await updateDoc(docRef, { growthRecords: arrayUnion(newRecord) });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { growthRecords: [newRecord] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const updateGrowthRecord = async (animalId: string, updatedRecord: GrowthRecord): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    await runTransaction(firestore, async (transaction) => {
      const animalDoc = await transaction.get(docRef);
      if (!animalDoc.exists()) {
        throw "Document does not exist!";
      }
      const currentRecords: GrowthRecord[] = (animalDoc.data().growthRecords || []).map((rec: any) => ({...rec, date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date)}));
      const recordIndex = currentRecords.findIndex(rec => rec.id === updatedRecord.id);
      if (recordIndex === -1) {
        // Fallback for old data that might not have an ID
        const dateMatchIndex = currentRecords.findIndex(rec => rec.date.getTime() === updatedRecord.date.getTime() && rec.weight === updatedRecord.weight);
         if(dateMatchIndex !== -1) {
            currentRecords[dateMatchIndex] = { ...updatedRecord, id: updatedRecord.id || `gr_${Date.now()}` };
         } else {
            throw `Record with id ${updatedRecord.id} not found.`;
         }
      } else {
         currentRecords[recordIndex] = updatedRecord;
      }
      
      transaction.update(docRef, { growthRecords: currentRecords });
    });
  } catch (e) {
     const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { growthRecords: [updatedRecord] },
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const deleteGrowthRecord = async (animalId: string, recordToDelete: GrowthRecord): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  
  // The object to remove needs to be an exact match, including the date object type.
  const recordToRemove = {
    ...recordToDelete,
    date: new Date(recordToDelete.date), // ensure it's a JS Date
    adg: undefined // adg is a calculated field and not stored
  };
  delete (recordToRemove as Partial<typeof recordToRemove>).adg;
  
  try {
     await runTransaction(firestore, async (transaction) => {
        const animalDoc = await transaction.get(docRef);
        if (!animalDoc.exists()) {
            throw "Document does not exist!";
        }

        const currentRecords: GrowthRecord[] = (animalDoc.data().growthRecords || []).map((rec: any) => ({
            ...rec,
            date: rec.date.toDate() // Ensure all dates are JS Dates for comparison
        }));
        
        const recordIndex = currentRecords.findIndex(rec => rec.id === recordToDelete.id);

        if (recordIndex > -1) {
            currentRecords.splice(recordIndex, 1);
            transaction.update(docRef, { growthRecords: currentRecords });
        } else {
             // Fallback for older data without IDs
            const recordsToKeep = currentRecords.filter(rec => !(rec.date.getTime() === recordToDelete.date.getTime() && rec.weight === recordToDelete.weight));
            if(recordsToKeep.length < currentRecords.length) {
                 transaction.update(docRef, { growthRecords: recordsToKeep });
            } else {
                console.warn("Could not find record to delete:", recordToDelete);
            }
        }
    });
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { growthRecords: [] }, // Approximation
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};
