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
    // The listener is set up once and handles all data updates.
    const unsubscribe = listenToAnimals((animals) => {
      // If the listener returns an empty array, it means no data exists yet.
      // We trigger the creation of default data in this case.
      if (animals.length === 0) {
        // We don't need to show a loading state here, as the listener
        // will automatically receive the new data once it's created.
        createDefaultAnimals().catch(console.error);
      }
      
      setAllAnimals(animals);

      // If no animal is selected, or the selected one is no longer in the list,
      // default to selecting the first animal.
      if (animals.length > 0 && (!selectedAnimalId || !animals.some(a => a.id === selectedAnimalId))) {
        setSelectedAnimalId(animals[0].id);
      } else if (animals.length === 0) {
        // If there are no animals at all, clear the selection.
        setSelectedAnimalId(null);
      }
    });

    // Cleanup the listener when the component unmounts.
    return () => unsubscribe();
  }, [selectedAnimalId]); // We keep selectedAnimalId here to re-evaluate the selection logic if it changes.

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
          isPreparingData={allAnimals.length === 0}
        />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            {allAnimals.length === 0 ? (
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
