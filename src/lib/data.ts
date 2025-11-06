'use client';

import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
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
      const docId = `KIT-${String(i).padStart(3, '0')}`;
      const docRef = doc(firestore, LIVESTOCK_COLLECTION, docId);
      const animalData = generateDefaultData(i);
      batch.set(docRef, { ...animalData, id: docId });
    }
    await batch.commit();
    console.log(`${count} default animals created successfully.`);
  } catch (error) {
    console.error("Error creating default animals:", error);
  }
}

export function listenToAnimals(callback: (animals: Livestock[]) => void): () => void {
  const livestockCollectionRef = collection(firestore, LIVESTOCK_COLLECTION);
  const unsubscribe = onSnapshot(livestockCollectionRef, (snapshot) => {
    const animals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      birthDate: doc.data().birthDate?.toDate ? doc.data().birthDate.toDate() : new Date(doc.data().birthDate),
      healthLog: doc.data().healthLog.map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
      reproductionLog: doc.data().reproductionLog.map((log: any) => ({...log, date: log.date?.toDate ? log.date.toDate() : new Date(log.date)})),
      growthRecords: doc.data().growthRecords.map((rec: any) => ({...rec, date: rec.date?.toDate ? rec.date.toDate() : new Date(rec.date)})),
    })) as Livestock[];
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

export const updateAnimal = async (id: string, updatedData: Partial<Livestock>): Promise<void> => {
  const docRef = doc(firestore, LIVESTOCK_COLLECTION, id);
  setDoc(docRef, updatedData, { merge: true }).catch(async (serverError) => {
    const permissionError = new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: updatedData,
    });
    console.error(permissionError.message);
    errorEmitter.emit('permission-error', permissionError);
  });
};
