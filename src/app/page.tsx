'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import LivestockSidebar from '@/components/livestock-sidebar';
import LivestockDetails from '@/components/livestock-details';
import { createDefaultAnimals, listenToAnimals } from '@/lib/data';
import type { Livestock } from '@/lib/types';
import { useUser } from '@/firebase';

export default function Home() {
  const [allAnimals, setAllAnimals] = useState<Livestock[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingData, setIsPreparingData] = useState(false);
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // We don't need to wait for auth anymore, just listen to data.
    const unsubscribe = listenToAnimals((animals) => {
      setAllAnimals(animals);
      setIsLoading(false);
      
      if (animals.length === 0 && !isPreparingData) {
        // If there's no data, trigger the creation process.
        setIsPreparingData(true);
        createDefaultAnimals().finally(() => setIsPreparingData(false));
      } else if (animals.length > 0 && !selectedAnimalId) {
        // If data exists, select the first animal by default.
        setSelectedAnimalId(animals[0].id);
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [selectedAnimalId, isPreparingData]); // Depend on selectedAnimalId and isPreparingData to re-evaluate defaults.

  const handleSelectAnimal = useCallback((id: string) => {
    setSelectedAnimalId(id);
  }, []);
  
  const selectedAnimal = useMemo(() => {
    return allAnimals.find(animal => animal.id === selectedAnimalId) ?? null;
  }, [allAnimals, selectedAnimalId]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <SidebarProvider>
        <LivestockSidebar
          animals={allAnimals}
          selectedAnimalId={selectedAnimalId}
          onSelect={handleSelectAnimal}
          isPreparingData={isPreparingData}
        />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            {isLoading ? (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">Memuat data ternak...</p>
              </div>
            ) : selectedAnimal ? (
              <LivestockDetails key={selectedAnimal.id} animal={selectedAnimal} />
            ) : (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">
                  {isPreparingData ? "Sedang menyiapkan data ternak awal..." : "Pilih ternak dari daftar untuk melihat detail"}
                </p>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}