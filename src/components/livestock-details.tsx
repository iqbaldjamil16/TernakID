'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  updateAnimal,
  addHealthLog,
  updateHealthLog,
  deleteHealthLog,
  addReproductionLog,
  updateReproductionLog,
  deleteReproductionLog,
  addGrowthRecord,
  updateGrowthRecord,
  deleteGrowthRecord,
  updateAnimalPhoto,
} from '@/lib/data';
import type { Livestock, HealthLog, ReproductionLog, GrowthRecord, Pedigree } from '@/lib/types';
import { calculateAge } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { HealthTab } from './health-tab';
import { ReproductionTab } from './reproduction-tab';
import { GrowthTab } from './growth-tab';
import { PedigreeTab } from './pedigree-tab';
import EditAnimalModal from './edit-animal-modal';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useToast } from '@/hooks/use-toast';

export default function LivestockDetails({ animal }: { animal: Livestock }) {
  const [currentAnimal, setCurrentAnimal] = useState<Livestock>(animal);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentAnimal(animal);
  }, [animal]);

  const handleUpdate = useCallback(async (updatedData: Partial<Omit<Livestock, 'id' | 'photoUrl'>>) => {
    // Only handles text data now
    await updateAnimal(currentAnimal.id, updatedData);
    // Listener will sync the UI
    setIsModalOpen(false);
  }, [currentAnimal.id]);
  
  const handleSavePhoto = useCallback(async (photoUrl: string) => {
    // Optimistic UI update for the photo
    setCurrentAnimal(prev => ({ ...prev, photoUrl }));
    await updateAnimalPhoto(currentAnimal.id, photoUrl);
    toast({
        title: "Foto Berhasil Diperbarui",
        description: "Gambar ternak telah disimpan secara permanen.",
    });
    // The listener will eventually sync, but the optimistic update makes it feel instant.
  }, [currentAnimal.id, toast]);

  const handleAddHealthLog = useCallback(async (log: Omit<HealthLog, 'id'>) => {
    await addHealthLog(currentAnimal.id, log);
    // Data will be re-fetched by the listener, so no need for optimistic update here.
  }, [currentAnimal.id]);
  
  const handleUpdateHealthLog = useCallback(async (log: HealthLog) => {
    await updateHealthLog(currentAnimal.id, log);
    // Data will be re-fetched by the listener
  }, [currentAnimal.id]);

  const handleDeleteHealthLog = useCallback(async (log: HealthLog) => {
    await deleteHealthLog(currentAnimal.id, log);
     // Data will be re-fetched by the listener
  }, [currentAnimal.id]);

  const handleAddReproductionLog = useCallback(async (log: Omit<ReproductionLog, 'id'>) => {
    await addReproductionLog(currentAnimal.id, log);
     // Data will be re-fetched by the listener
  }, [currentAnimal.id]);
  
  const handleUpdateReproductionLog = useCallback(async (log: ReproductionLog) => {
    await updateReproductionLog(currentAnimal.id, log);
    // Data will be re-fetched by the listener
  }, [currentAnimal.id]);

  const handleDeleteReproductionLog = useCallback(async (log: ReproductionLog) => {
    await deleteReproductionLog(currentAnimal.id, log);
    // Data will be re-fetched by the listener
  }, [currentAnimal.id]);

  const handleAddGrowthRecord = useCallback(async (record: Omit<GrowthRecord, 'id' | 'adg'>) => {
    await addGrowthRecord(currentAnimal.id, record);
     // Data will be re-fetched by the listener
  }, [currentAnimal.id]);

  const handleUpdateGrowthRecord = useCallback(async (record: GrowthRecord) => {
    await updateGrowthRecord(currentAnimal.id, record);
    // Data will be re-fetched by the listener
  }, [currentAnimal.id]);

  const handleDeleteGrowthRecord = useCallback(async (record: GrowthRecord) => {
    await deleteGrowthRecord(currentAnimal.id, record);
    // Data will be re-fetched by the listener
  }, [currentAnimal.id]);
  
  const handleUpdatePedigree = useCallback(async (data: { pedigree: Pedigree }) => {
    await updateAnimal(currentAnimal.id, { pedigree: data.pedigree });
     // Data will be re-fetched by the listener
  }, [currentAnimal.id]);

  if (!currentAnimal) {
    return <DetailsSkeleton />;
  }

  const age = calculateAge(currentAnimal.birthDate);
  const photoSrc = currentAnimal.photoUrl || `https://picsum.photos/seed/${currentAnimal.id}/400/400`;

  return (
    <>
      <div className="bg-card rounded-xl overflow-hidden shadow-lg">
        <div className="bg-primary text-primary-foreground p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="md:hidden size-11 flex-shrink-0" />
              <h1 className="text-3xl font-bold">E-TernakID</h1>
            </div>
            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              <Badge variant="secondary" className="bg-white text-primary hover:bg-white">{currentAnimal.status}</Badge>
              <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)} className="bg-yellow-400 text-gray-900 hover:bg-yellow-500">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
            <Dialog>
              <DialogTrigger asChild>
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-white object-cover mb-4 sm:mb-0 sm:mr-8 mx-auto sm:mx-0 cursor-pointer flex-shrink-0">
                  <Image
                      src={photoSrc}
                      alt={`Foto ${currentAnimal.name}`}
                      width={400}
                      height={400}
                      className="rounded-full w-full h-full object-cover"
                      data-ai-hint="livestock animal"
                      priority
                    />
                </div>
              </DialogTrigger>
              <DialogContent className="p-0 max-w-xl bg-transparent border-0">
                <DialogHeader className="sr-only">
                  <DialogTitle>Foto Ternak: {currentAnimal.name}</DialogTitle>
                </DialogHeader>
                <Image
                  src={photoSrc}
                  alt={`Foto ${currentAnimal.name}`}
                  width={800}
                  height={800}
                  className="rounded-lg object-contain w-full h-full"
                />
              </DialogContent>
            </Dialog>
            <div className="sm:mt-8 text-center sm:text-left w-full">
              <h2 className="text-3xl sm:text-4xl font-extrabold">{currentAnimal.name}</h2>
              <p className="text-sm opacity-90">No. Registrasi: {currentAnimal.regId}</p>
              <p className="text-lg font-semibold mt-1">{currentAnimal.breed}, {currentAnimal.gender}</p>
               <div className="mt-4 flex flex-wrap gap-2 items-center justify-center sm:justify-start sm:hidden">
                  <Badge variant="secondary" className="bg-white text-primary hover:bg-white">{currentAnimal.status}</Badge>
                  <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)} className="bg-yellow-400 text-gray-900 hover:bg-yellow-500">
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </Button>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b bg-muted/30">
          <InfoItem label="Tanggal Lahir" value={currentAnimal.birthDate ? currentAnimal.birthDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
          <InfoItem label="Usia" value={age} />
          <InfoItem label="Pemilik" value={currentAnimal.owner} />
          <InfoItem label="Alamat Peternakan" value={currentAnimal.address} />
        </div>

        <Tabs defaultValue="kesehatan" className="p-4 sm:p-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="kesehatan">Riwayat Kesehatan</TabsTrigger>
            <TabsTrigger value="reproduksi">Riwayat Reproduksi</TabsTrigger>
            <TabsTrigger value="pertumbuhan">Data Pertumbuhan</TabsTrigger>
            <TabsTrigger value="silsilah">Silsilah Induk</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="kesehatan">
              <HealthTab 
                animal={currentAnimal} 
                onAddLog={handleAddHealthLog} 
                onUpdateLog={handleUpdateHealthLog}
                onDeleteLog={handleDeleteHealthLog}
              />
            </TabsContent>
            <TabsContent value="reproduksi">
              <ReproductionTab 
                animal={currentAnimal} 
                onAddLog={handleAddReproductionLog}
                onUpdateLog={handleUpdateReproductionLog}
                onDeleteLog={handleDeleteReproductionLog}
              />
            </TabsContent>
            <TabsContent value="pertumbuhan">
              <GrowthTab 
                animal={currentAnimal} 
                onAddRecord={handleAddGrowthRecord} 
                onUpdateRecord={handleUpdateGrowthRecord}
                onDeleteRecord={handleDeleteGrowthRecord}
              />
            </TabsContent>
            <TabsContent value="silsilah"><PedigreeTab animal={currentAnimal} onUpdate={handleUpdatePedigree} /></TabsContent>
          </div>
        </Tabs>
      </div>
      {isModalOpen && (
        <EditAnimalModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          animal={currentAnimal}
          onSave={handleUpdate}
          onSavePhoto={handleSavePhoto}
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

    
