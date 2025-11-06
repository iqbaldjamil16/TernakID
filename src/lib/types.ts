export type HealthLog = {
  date: Date;
  type: 'Vaksinasi' | 'Penyakit' | 'Pengobatan' | 'Lainnya';
  vaccineOrMedicineName?: string;
  detail?: string; // Re-adding for compatibility with existing data
  diagnosis?: string;
  notes?: string;
};

export type ReproductionLog = {
  date: Date;
  type: 'Inseminasi Buatan (IB)' | 'Kawin Alami' | 'Kebuntingan Dideteksi' | 'Melahirkan' | 'Kelahiran' | 'Abortus' | 'Lainnya';
  detail: string;
  notes?: string;
};

export type GrowthRecord = {
  date: Date;
  weight: number;
  adg?: string;
};

export type Dam = {
  name: string;
  regId: string;
  breed: string;
  offspring: number;
};

export type Sire = {
  name: string;
  semenId: string;
  breed: string;
  characteristics: string;
};

export type Pedigree = {
  dam: Dam;
  sire: Sire;
};

export type Livestock = {
  id: string;
  name: string;
  regId: string;
  breed: string;
  gender: 'Jantan' | 'Betina';
  status: string;
  owner: string;
  address: string;
  birthDate: Date | null;
  photoUrl?: string;
  healthLog: HealthLog[];
  reproductionLog: ReproductionLog[];
  growthRecords: GrowthRecord[];
  pedigree: Pedigree;
};
