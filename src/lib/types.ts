export type HealthLog = {
  id: string; // Unique identifier
  date: Date;
  type: string;
  detail?: string;
  notes?: string;
};

export type ReproductionLog = {
  date: Date;
  type: string;
  detail: string;
  notes?: string;
};

export type GrowthRecord = {
  date: Date;
  weight: number;
  adg?: string;
};

export type Dam = {
  name?: string;
  regId?: string;
  breed?: string;
  offspring?: number;
};

export type Sire = {
  name?: string;
  semenId?: string;
  breed?: string;
  characteristics?: string;
};

export type Pedigree = {
  dam?: Dam;
  sire?: Sire;
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
  birthDate: Date;
  photoUrl?: string;
  healthLog: HealthLog[];
  reproductionLog: ReproductionLog[];
  growthRecords: GrowthRecord[];
  pedigree?: Pedigree;
};
