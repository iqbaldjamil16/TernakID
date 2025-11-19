
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import LivestockSidebar from '@/components/livestock-sidebar';
import LivestockDetails from '@/components/livestock-details';
import { createDefaultAnimals, listenToAnimals } from '@/lib/data';
import type { Livestock } from '@/lib/types';

export default function Home() {
  const [allAnimals, setAllAnimals] = useState<Livestock[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);

  useEffect(() => {
    // Listener ini akan menangani semua pembaruan data dari Firestore.
    const unsubscribe = listenToAnimals((animals) => {
      setAllAnimals(animals);

      // Jika tidak ada data sama sekali, buat data awal.
      if (animals.length === 0) {
        createDefaultAnimals().catch(console.error);
      } 
      // Jika data sudah ada, tapi belum ada ternak yang dipilih,
      // atau ternak yang dipilih sudah tidak ada, maka pilih ternak pertama.
      else if (!selectedAnimalId || !animals.some(a => a.id === selectedAnimalId)) {
        setSelectedAnimalId(animals[0].id);
      }
    });

    // Membersihkan listener saat komponen tidak lagi digunakan.
    return () => unsubscribe();
  }, [selectedAnimalId]); // Dependensi ditambahkan untuk memastikan logika pemilihan ulang berjalan jika diperlukan.


  const handleSelectAnimal = useCallback((id: string) => {
    setSelectedAnimalId(id);
  }, []);
  
  const selectedAnimal = useMemo(() => {
    return allAnimals.find(animal => animal.id === selectedAnimalId) ?? null;
  }, [allAnimals, selectedAnimalId]);

  const isDataReady = allAnimals.length > 0;

  return (
    <div className="bg-slate-50 min-h-screen">
      <SidebarProvider>
        <LivestockSidebar
          animals={allAnimals}
          selectedAnimalId={selectedAnimalId}
          onSelect={handleSelectAnimal}
          isPreparingData={!isDataReady}
        />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            {!isDataReady ? (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">Sedang menyiapkan data ternak awal...</p>
              </div>
            ) : selectedAnimal ? (
              <LivestockDetails key={selectedAnimal.id} animal={selectedAnimal} />
            ) : (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">Pilih ternak dari daftar untuk melihat detail.</p>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
