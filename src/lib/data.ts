'use client'

import { Livestock, HealthLog, ReproductionLog, GrowthRecord } from './types';

const ANIMAL_COUNT = 100;

// Use a Map to store the data in memory. This acts as our "database".
const livestockDB = new Map<string, Livestock>();

const generateDefaultData = (id: string): Livestock => {
  const idNumber = parseInt(id.split('-')[1]);
  const birthDate = new Date(2023, 0, 1 + (idNumber % 30));
  birthDate.setFullYear(birthDate.getFullYear() - (idNumber % 5)); // Vary age from 0-4 years

  return {
    id: id,
    name: `Ternak ${id.split('-')[1]}`,
    regId: id,
    photoUrl: `https://picsum.photos/seed/${id}/400/400`,
    breed: (idNumber % 3 === 0) ? "Sapi Bali" : (idNumber % 3 === 1) ? "Sapi Ongole" : "Simental",
    gender: (idNumber % 2 === 0) ? "Jantan" : "Betina",
    status: (idNumber % 10 === 0) ? "Dijual" : "Produktif",
    owner: "Peternakan Jaya",
    address: `Kandang ${Math.ceil(idNumber / 10)}, Desa Makmur`,
    birthDate: birthDate,
    healthLog: [],
    reproduction: {
      role: (idNumber % 2 === 0) ? "Pejantan" : "Indukan",
      semenQuality: (idNumber % 2 === 0) ? 'Baik' : 'N/A',
      semenTestDate: (idNumber % 2 === 0) ? new Date(2024, 4, 1) : null,
      recentMatings: idNumber % 5,
      successRate: (idNumber % 2 === 0) ? '85%' : 'N/A',
    },
    reproductionLog: [],
    growthRecords: [
      { date: birthDate, weight: 30 + (idNumber % 10) },
      { date: new Date(birthDate.getTime() + 180 * 24 * 3600 * 1000), weight: 150 + (idNumber % 50) },
    ],
    pedigree: {
      dam: { name: `Induk-${1000+idNumber}`, regId: `IND-${1000+idNumber}`, breed: "Sapi Bali", offspring: 2 },
      sire: { name: `Pejantan-${2000+idNumber}`, semenId: `PJT-${2000+idNumber}`, breed: "Simental", characteristics: "Postur tinggi" },
    }
  };
};

// --- Public API for data access ---

// Initialize the database
for (let i = 1; i <= ANIMAL_COUNT; i++) {
  const id = `KIT-${String(i).padStart(2, '0')}`;
  livestockDB.set(id, generateDefaultData(id));
}

export const getAnimalIds = (): string[] => {
  return Array.from(livestockDB.keys());
};

export const getAnimal = (id: string): Livestock | undefined => {
  // Return a deep copy to prevent direct mutation of the "database"
  const animal = livestockDB.get(id);
  return animal ? JSON.parse(JSON.stringify(animal), (key, value) => {
    if (key.toLowerCase().includes('date') && value) {
        return new Date(value);
    }
    return value;
  }) : undefined;
};

export const updateAnimal = (id: string, updatedData: Partial<Livestock>): Livestock | undefined => {
  const currentData = livestockDB.get(id);
  if (currentData) {
    const newData: Livestock = { 
        ...currentData, 
        ...updatedData,
        // Deep merge for nested objects
        reproduction: { ...currentData.reproduction, ...updatedData.reproduction },
        pedigree: {
            dam: { ...currentData.pedigree.dam, ...updatedData.pedigree?.dam },
            sire: { ...currentData.pedigree.sire, ...updatedData.pedigree?.sire },
        }
    };
    livestockDB.set(id, newData);
    return getAnimal(id); // Return a fresh copy
  }
  return undefined;
};

export const addHealthLog = (animalId: string, newLog: HealthLog): Livestock | undefined => {
    const animal = livestockDB.get(animalId);
    if(animal) {
        animal.healthLog.push(newLog);
        livestockDB.set(animalId, animal);
        return getAnimal(animalId);
    }
    return undefined;
}

export const addReproductionLog = (animalId: string, newLog: ReproductionLog): Livestock | undefined => {
    const animal = livestockDB.get(animalId);
    if(animal) {
        animal.reproductionLog.push(newLog);
        livestockDB.set(animalId, animal);
        return getAnimal(animalId);
    }
    return undefined;
}

export const addGrowthRecord = (animalId: string, newRecord: GrowthRecord): Livestock | undefined => {
    const animal = livestockDB.get(animalId);
    if(animal) {
        animal.growthRecords.push(newRecord);
        livestockDB.set(animalId, animal);
        return getAnimal(animalId);
    }
    return undefined;
}
