'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  getAnimal,
  updateAnimal,
  addHealthLog,
  addReproductionLog,
  addGrowthRecord
} from '@/lib/data';
import type { Livestock, HealthLog, ReproductionLog, GrowthRecord, Pedigree } from '@/lib/types';
import { calculateAge } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil } from 'lucide-react';
import { HealthTab } from './health-tab';
import { ReproductionTab } from './reproduction-tab';
import { GrowthTab } from './growth-tab';
import { PedigreeTab } from './pedigree-tab';
import EditAnimalModal from './edit-animal-modal';

export default function LivestockDetails({ animalId }: { animalId: string }) {
  const [animal, setAnimal] = useState<Livestock | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnimalData = useCallback(() => {
    setLoading(true);
    const data = getAnimal(animalId);
    if (data) {
      setAnimal(data);
    }
    setLoading(false);
  }, [animalId]);

  useEffect(() => {
    fetchAnimalData();
  }, [fetchAnimalData]);
  
  const handleUpdate = useCallback(async (updatedData: Partial<Livestock>) => {
    const updatedAnimal = updateAnimal(animalId, updatedData);
    if(updatedAnimal) setAnimal(updatedAnimal);
  }, [animalId]);

  const handleAddHealthLog = useCallback(async (log: Omit<HealthLog, 'date'> & {date: string}) => {
    const newAnimal = addHealthLog(animalId, {...log, date: new Date(log.date)});
    if(newAnimal) setAnimal(newAnimal);
  }, [animalId]);

  const handleAddReproductionLog = useCallback(async (log: Omit<ReproductionLog, 'date'> & {date: string}) => {
    const newAnimal = addReproductionLog(animalId, {...log, date: new Date(log.date)});
    if(newAnimal) setAnimal(newAnimal);
  }, [animalId]);

  const handleAddGrowthRecord = useCallback(async (record: Omit<GrowthRecord, 'date'>) => {
    const newAnimal = addGrowthRecord(animalId, {...record, date: new Date()});
    if(newAnimal) setAnimal(newAnimal);
  }, [animalId]);

  if (loading || !animal) {
    return <DetailsSkeleton />;
  }

  const age = calculateAge(animal.birthDate);

  return (
    <>
      <div className="bg-card rounded-xl overflow-hidden shadow-lg">
        <div className="bg-primary text-primary-foreground p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">E-TernakID</h1>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white text-primary hover:bg-white">{animal.status}</Badge>
              <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)} className="bg-yellow-400 text-gray-900 hover:bg-yellow-500">
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center">
             <Image
                src={animal.photoUrl || `https://picsum.photos/seed/${animal.id}/400/400`}
                alt={`Foto ${animal.name}`}
                width={400}
                height={400}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-white object-cover mb-4 sm:mb-0 sm:mr-8"
                data-ai-hint="livestock animal"
                priority
              />
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold">{animal.name}</h2>
              <p className="text-sm opacity-90">No. Registrasi: {animal.regId}</p>
              <p className="text-lg font-semibold mt-1">{animal.breed}, {animal.gender}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b bg-muted/30">
          <InfoItem label="Tanggal Lahir" value={animal.birthDate ? animal.birthDate.toLocaleDateString('id-ID') : 'N/A'} />
          <InfoItem label="Usia" value={age} />
          <InfoItem label="Pemilik" value={animal.owner} />
          <InfoItem label="Alamat Peternakan" value={animal.address} />
        </div>

        <Tabs defaultValue="kesehatan" className="p-4 sm:p-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="kesehatan">Riwayat Kesehatan</TabsTrigger>
            <TabsTrigger value="reproduksi">Riwayat Reproduksi</TabsTrigger>
            <TabsTrigger value="pertumbuhan">Data Pertumbuhan</TabsTrigger>
            <TabsTrigger value="silsilah">Silsilah Induk</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="kesehatan"><HealthTab animal={animal} onAddLog={handleAddHealthLog} /></TabsContent>
            <TabsContent value="reproduksi"><ReproductionTab animal={animal} onAddLog={handleAddReproductionLog} /></TabsContent>
            <TabsContent value="pertumbuhan"><GrowthTab animal={animal} onAddRecord={handleAddGrowthRecord} /></TabsContent>
            <TabsContent value="silsilah"><PedigreeTab animal={animal} onUpdate={handleUpdate} /></TabsContent>
          </div>
        </Tabs>
      </div>
      {isModalOpen && (
        <EditAnimalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          animal={animal}
          onSave={handleUpdate}
        />
      )}
    </>
  );
}

const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="text-sm">
    <p className="text-muted-foreground">{label}</p>
    <p className="font-semibold truncate">{value}</p>
  </div>
);

const DetailsSkeleton = () => (
    <div className="bg-card rounded-xl overflow-hidden shadow-lg">
        <div className="bg-primary/80 p-6 sm:p-8 animate-pulse">
            <div className="flex justify-between items-center">
                <Skeleton className="h-9 w-40 bg-white/30" />
                <Skeleton className="h-8 w-32 bg-white/30" />
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-center">
                <Skeleton className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-white bg-white/30" />
                <div className="ml-6 space-y-2">
                    <Skeleton className="h-10 w-64 bg-white/30" />
                    <Skeleton className="h-5 w-48 bg-white/30" />
                    <Skeleton className="h-6 w-40 bg-white/30" />
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-32" />
                </div>
            ))}
        </div>
        <div className="p-6">
            <Skeleton className="h-10 w-full" />
            <div className="mt-6 space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    </div>
)
