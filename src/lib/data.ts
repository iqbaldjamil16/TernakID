'use client';

import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  getFirestore,
  onSnapshot,
} from 'firebase/firestore';
import { initializeFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Livestock, HealthLog, ReproductionLog, GrowthRecord } from './types';

const { firestore } = initializeFirebase();
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
    owner: "Peternakan Bersama",
    address: `Kandang Bersama, Desa Makmur`,
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
  try {
    const livestockCollectionRef = collection(firestore, LIVESTOCK_COLLECTION);
    const snapshot = await getDocs(livestockCollectionRef);

    if (!snapshot.empty) {
      console.log('Database already has livestock data. Skipping creation.');
      return;
    }

    console.log('No livestock data found. Creating default set...');
    const batch = writeBatch(firestore);
    for (let i = 1; i <= count; i++) {
      const docRef = doc(firestore, LIVESTOCK_COLLECTION, `KIT-${String(i).padStart(3, '0')}`);
      const animalData = generateDefaultData(i);
      batch.set(docRef, animalData);
    }
    await batch.commit();
    console.log(`${count} default animals created successfully.`);
  } catch (error) {
    console.error("Error creating default animals:", error);
  }
}

export const getAnimalIds = async (): Promise<string[]> => {
    try {
        const snapshot = await getDocs(collection(firestore, LIVESTOCK_COLLECTION));
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error("Error getting animal IDs: ", error);
        return [];
    }
};

export function listenToAnimals(callback: (animals: Livestock[]) => void): () => void {
  const livestockCollectionRef = collection(firestore, LIVESTOCK_COLLECTION);
  const unsubscribe = onSnapshot(livestockCollectionRef, (snapshot) => {
    const animals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Ensure date fields are correctly parsed from Firestore Timestamps or strings
      birthDate: doc.data().birthDate?.toDate ? doc.data().birthDate.toDate() : new Date(doc.data().birthDate),
      healthLog: doc.data().healthLog.map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
      reproductionLog: doc.data().reproductionLog.map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
      growthRecords: doc.data().growthRecords.map((rec: any) => ({...rec, date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date)})),
    })) as Livestock[];
    callback(animals);
  }, (serverError) => {
      // Create the rich, contextual error asynchronously.
      const permissionError = new FirestorePermissionError({
        path: livestockCollectionRef.path,
        operation: 'list',
      });
      // Emit the error with the global error emitter
      errorEmitter.emit('permission-error', permissionError);
  });
  return unsubscribe;
}

export const getAnimal = async (id: string): Promise<Livestock | undefined> => {
  // This function might not be strictly necessary if all data is loaded at once,
  // but it's good to keep for potential direct fetching.
  const allAnimals = await getAllAnimals();
  return allAnimals.find(animal => animal.id === id);
};

export const getAllAnimals = async (): Promise<Livestock[]> => {
    try {
        const snapshot = await getDocs(collection(firestore, LIVESTOCK_COLLECTION));
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                birthDate: data.birthDate?.toDate ? data.birthDate.toDate() : new Date(data.birthDate),
                healthLog: data.healthLog.map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
                reproductionLog: data.reproductionLog.map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
                growthRecords: data.growthRecords.map((rec: any) => ({...rec, date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date)})),
            } as Livestock
        });
    } catch (error) {
        console.error("Error getting all animals: ", error);
        return [];
    }
}


export const updateAnimal = async (id: string, updatedData: Partial<Livestock>): Promise<void> => {
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, id);
  setDoc(docRef, updatedData, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updatedData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
};

export const addHealthLog = async (animalId: string, newLog: HealthLog): Promise<void> => {
    const animal = await getAnimal(animalId);
    if (animal) {
        const updatedLogs = [...animal.healthLog, newLog];
        await updateAnimal(animalId, { healthLog: updatedLogs });
    }
}

export const addReproductionLog = async (animalId: string, newLog: ReproductionLog): Promise<void> => {
    const animal = await getAnimal(animalId);
    if (animal) {
        const updatedLogs = [...animal.reproductionLog, newLog];
        await updateAnimal(animalId, { reproductionLog: updatedLogs });
    }
}

export const addGrowthRecord = async (animalId: string, newRecord: GrowthRecord): Promise<void> => {
    const animal = await getAnimal(animalId);
    if (animal) {
        const updatedRecords = [...animal.growthRecords, newRecord];
        await updateAnimal(animalId, { growthRecords: updatedRecords });
    }
}
