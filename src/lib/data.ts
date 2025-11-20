'use client';

import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  onSnapshot,
  query,
  limit,
  updateDoc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Livestock, HealthLog, ReproductionLog, GrowthRecord } from '@/lib/types';

const LIVESTOCK_COLLECTION = 'livestock';

const generateDefaultData = (idNumber: number): Omit<Livestock, 'id'> => {
  const birthDate = new Date(2023, 0, 1 + (idNumber % 30));
  birthDate.setFullYear(birthDate.getFullYear() - (idNumber % 5));
  const now = Date.now();
  
  const animalName = idNumber === 1 ? "Bambang" : `Ternak ${idNumber}`;

  return {
    name: animalName,
    regId: `KIT-${String(idNumber).padStart(3, '0')}`,
    photoUrl: `https://picsum.photos/seed/animal${idNumber}/400/400`,
    breed: (idNumber % 3 === 0) ? "Sapi Bali" : (idNumber % 3 === 1) ? "Sapi Ongole" : "Simental",
    gender: (idNumber % 2 === 0) ? "Jantan" : "Betina",
    status: (idNumber % 10 === 0) ? "Dijual" : "Produktif",
    owner: "Peternakan Umum",
    address: `Kandang Umum, Desa Makmur`,
    birthDate: birthDate,
    healthLog: [
      { id: `hl_${now}_${idNumber}_1`, date: new Date(birthDate.getTime() + 30 * 24 * 3600 * 1000), type: 'Vaksinasi', detail: 'Vaksin PMK', notes: 'Dosis pertama' },
    ],
    reproductionLog: [
       { id: `rl_${now}_${idNumber}_1`, date: new Date(birthDate.getTime() + 730 * 24 * 3600 * 1000), type: 'Inseminasi Buatan (IB)', detail: 'Semen ID: BX-01', notes: 'IB pertama' },
    ],
    growthRecords: [],
    pedigree: {
      dam: { name: `Induk-${1000 + idNumber}`, regId: `IND-${1000 + idNumber}`, breed: "Sapi Bali", offspring: 2 },
      sire: { name: `Pejantan-${2000 + idNumber}`, semenId: `PJT-${2000 + idNumber}`, breed: "Simental", characteristics: "Postur tinggi" },
    }
  };
};

export async function createDefaultAnimals() {
  const count = 14;
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
    const permissionError = new FirestorePermissionError({
      path: LIVESTOCK_COLLECTION,
      operation: 'create',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
}

export async function createNewAnimal() {
  const { firestore } = initializeFirebase();
  const livestockCollectionRef = collection(firestore, LIVESTOCK_COLLECTION);

  try {
    const snapshot = await getDocs(livestockCollectionRef);
    // This logic ensures that the new ID is always one greater than the number of existing animals.
    const newIdNumber = snapshot.size + 1; 
    const newDocId = `KIT-${String(newIdNumber).padStart(3, '0')}`;
    
    const newAnimalData: Livestock = {
      id: newDocId,
      name: `Ternak Baru ${newIdNumber}`,
      regId: newDocId,
      breed: 'Belum Ditentukan',
      gender: 'Jantan',
      status: 'Produktif',
      owner: 'Belum Ditentukan',
      address: 'Belum Ditentukan',
      birthDate: new Date(),
      photoUrl: `https://picsum.photos/seed/animal${newIdNumber}/400/400`,
      healthLog: [],
      reproductionLog: [],
      growthRecords: [],
      pedigree: {},
    };

    const docRef = doc(firestore, LIVESTOCK_COLLECTION, newDocId);
    await setDoc(docRef, newAnimalData);
    
    return newDocId;

  } catch (error) {
    const permissionError = new FirestorePermissionError({
      path: livestockCollectionRef.path,
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
        const now = Date.now();
        return {
            id: doc.id,
            ...data,
            birthDate: data.birthDate?.toDate ? data.birthDate.toDate() : new Date(data.birthDate),
            healthLog: (data.healthLog || []).map((log: any, index: number) => ({...log, id: log.id || `hl_${now}_${index}_${Math.random()}`, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
            reproductionLog: (data.reproductionLog || []).map((log: any, index: number) => ({...log, id: log.id || `rl_${now}_${index}_${Math.random()}`, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
            growthRecords: (data.growthRecords || []).map((rec: any, index: number) => ({...rec, id: rec.id || `gr_${now}_${index}_${Math.random()}`, date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date)})),
        } as Livestock;
    });
    callback(animals);
  }, (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: livestockCollectionRef.path,
        operation: 'list',
      });
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
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};


export const updateHealthLog = async (animalId: string, updatedLog: HealthLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    const animalDoc = await getDoc(docRef);
    if (!animalDoc.exists()) throw new Error("Document does not exist!");
    
    const currentLogs: HealthLog[] = (animalDoc.data().healthLog || []).map((log: any) => ({
      ...log, 
      id: log.id || `hl_fallback_${Math.random()}`,
      date: log.date?.toDate ? log.date.toDate() : new Date(log.date)
    }));
      
    const logIndex = currentLogs.findIndex(log => log.id === updatedLog.id);
    
    if (logIndex !== -1) {
      currentLogs[logIndex] = updatedLog;
    } else {
       throw new Error(`Log with id ${updatedLog.id} not found.`);
    }

    await setDoc(docRef, { healthLog: currentLogs }, { merge: true });

  } catch (e) {
     const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { healthLog: [updatedLog] },
    });
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
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const updateReproductionLog = async (animalId: string, updatedLog: ReproductionLog): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    const animalDoc = await getDoc(docRef);
    if (!animalDoc.exists()) throw new Error("Document does not exist!");

    const currentLogs: ReproductionLog[] = (animalDoc.data().reproductionLog || []).map((log: any) => ({
      ...log,
      id: log.id || `rl_fallback_${Math.random()}`,
      date: log.date?.toDate ? log.date.toDate() : new Date(log.date)
    }));

    const logIndex = currentLogs.findIndex(log => log.id === updatedLog.id);
    
    if (logIndex !== -1) {
      currentLogs[logIndex] = updatedLog;
    } else {
      throw new Error(`Log with id ${updatedLog.id} not found.`);
    }

    await setDoc(docRef, { reproductionLog: currentLogs }, { merge: true });

  } catch (e) {
     const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { reproductionLog: [updatedLog] },
    });
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
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const updateGrowthRecord = async (animalId: string, updatedRecord: GrowthRecord): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    const animalDoc = await getDoc(docRef);
    if (!animalDoc.exists()) {
      throw new Error("Document does not exist!");
    }

    const currentRecords: GrowthRecord[] = (animalDoc.data().growthRecords || []).map((rec: any) => ({
      ...rec,
      id: rec.id || `gr_fallback_${rec.date.toMillis()}_${Math.random()}`,
      date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date),
    }));

    const recordIndex = currentRecords.findIndex(rec => rec.id === updatedRecord.id);

    if (recordIndex !== -1) {
      currentRecords[recordIndex] = updatedRecord;
    } else {
      throw new Error(`Record with id ${updatedRecord.id} not found for update.`);
    }
    
    const recordsToSave = currentRecords.map(({ adg, ...rest }) => rest);

    await setDoc(docRef, { growthRecords: recordsToSave }, { merge: true });

  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { growthRecords: [updatedRecord] },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const deleteGrowthRecord = async (animalId: string, recordId: string): Promise<void> => {
  const { firestore } = initializeFirebase();
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, animalId);
  try {
    const animalDoc = await getDoc(docRef);
    if (!animalDoc.exists()) {
      throw new Error("Document does not exist!");
    }

    const currentRecords: GrowthRecord[] = (animalDoc.data().growthRecords || []).map((rec: any) => ({
      ...rec,
      id: rec.id || `gr_fallback_${rec.date.toMillis()}_${Math.random()}`,
      date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date),
    }));

    const updatedRecords = currentRecords.filter(rec => rec.id !== recordId);
    
    const recordsToSave = updatedRecords.map(({ adg, ...rest }) => rest);

    await setDoc(docRef, { growthRecords: recordsToSave }, { merge: true });
    
  } catch (e) {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: { growthRecords: [] }, // Simplified for deletion
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};
    