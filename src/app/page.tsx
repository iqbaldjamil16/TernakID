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

  useEffect(() => {
    // This flag prevents multiple data creation attempts if the component re-renders.
    let isDataCreationInitiated = false;

    const unsubscribe = listenToAnimals((animals) => {
      setIsLoading(false);
      
      // If we receive an empty list and data creation hasn't started yet.
      if (animals.length === 0 && !isDataCreationInitiated) {
        isDataCreationInitiated = true; // Mark as initiated.
        setIsLoading(true); // Show a loading state for the initial data preparation.
        createDefaultAnimals().catch(console.error); // We don't need to do anything in `finally`, listener will get new data.
      } else {
        setAllAnimals(animals);
        // Auto-select the first animal if none is selected, or if the selected one disappears.
        if (animals.length > 0 && (!selectedAnimalId || !animals.some(a => a.id === selectedAnimalId))) {
          setSelectedAnimalId(animals[0].id);
        }
      }
    });

    return () => unsubscribe();
    // By keeping the dependency array empty, we ensure the listener is set up only once.
    // The listener itself handles all subsequent state updates from Firestore.
  }, [selectedAnimalId]);

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
          isPreparingData={isLoading && allAnimals.length === 0}
        />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            {isLoading ? (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">{allAnimals.length === 0 ? "Sedang menyiapkan data ternak awal..." : "Memuat data ternak..."}</p>
              </div>
            ) : selectedAnimal ? (
              <LivestockDetails key={selectedAnimal.id} animal={selectedAnimal} />
            ) : allAnimals.length > 0 ? (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">
                  Pilih ternak dari daftar untuk melihat detail
                </p>
              </div>
            ) : (
               <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                 <p className="text-muted-foreground">Tidak ada data ternak. Memuat ulang mungkin akan membantu.</p>
               </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
