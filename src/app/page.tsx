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
    // This flag is local to the effect scope to prevent re-triggering data creation
    // if the component re-renders for other reasons.
    let isDataCreationInitiated = false;

    const unsubscribe = listenToAnimals((animals) => {
      setAllAnimals(animals);
      setIsLoading(false);
      
      // If we receive an empty list and data creation hasn't started yet
      if (animals.length === 0 && !isDataCreationInitiated) {
        isDataCreationInitiated = true; // Mark as initiated
        setIsPreparingData(true); // Set loading state for UI
        createDefaultAnimals().finally(() => {
           // No need to set isPreparingData to false, the listener will get the new data.
        });
      } else if (animals.length > 0) {
        // Data is present, so we are no longer preparing.
        if (isPreparingData) setIsPreparingData(false);

        // Auto-select the first animal if none is selected, or if the selected one disappears.
        if (!selectedAnimalId || !animals.some(a => a.id === selectedAnimalId)) {
          setSelectedAnimalId(animals[0].id);
        }
      }
    });

    return () => unsubscribe();
     // The dependency array is intentionally sparse.
     // We want the listener to set up only once.
     // State updates inside the listener handle the dynamic parts.
  }, [isPreparingData, selectedAnimalId]);

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
