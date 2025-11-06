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
  const [isLoading, setIsLoading] = useState(true);
  const [isPreparingData, setIsPreparingData] = useState(false);

  useEffect(() => {
    // This flag helps prevent multiple calls to createDefaultAnimals
    let isDataBeingPrepared = false;
    
    const unsubscribe = listenToAnimals((animals) => {
      setAllAnimals(animals);
      setIsLoading(false);

      if (animals.length === 0 && !isDataBeingPrepared && !isPreparingData) {
        isDataBeingPrepared = true;
        setIsPreparingData(true);
        createDefaultAnimals().finally(() => {
            // No need to set isPreparingData to false here, 
            // the listener will re-fire with new data and handle it.
        });
      } else if (animals.length > 0) {
        // If data is ready, stop showing the "preparing" message
        if (isPreparingData) setIsPreparingData(false);
        
        // If no animal is selected, select the first one.
        // Also handles the case right after initial data creation.
        if (!selectedAnimalId) {
          setSelectedAnimalId(animals[0].id);
        }
      }
    });

    return () => unsubscribe();
  }, [selectedAnimalId, isPreparingData]); // Keep dependencies to avoid re-running unnecessarily

  const handleSelectAnimal = useCallback((id: string) => {
    setSelectedAnimalId(id);
  }, []);
  
  const selectedAnimal = useMemo(() => {
    // Find the selected animal from the full list
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
            {isLoading && !isPreparingData ? (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">Memuat data ternak...</p>
              </div>
            ) : isPreparingData ? (
               <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                 <p className="text-muted-foreground">Sedang menyiapkan data ternak awal...</p>
               </div>
            ) : selectedAnimal ? (
              <LivestockDetails key={selectedAnimal.id} animal={selectedAnimal} />
            ) : (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">
                  Pilih ternak dari daftar untuk melihat detail
                </p>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
