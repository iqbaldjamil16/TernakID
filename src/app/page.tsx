'use client';
import { useState, useEffect, useMemo } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import LivestockSidebar from '@/components/livestock-sidebar';
import LivestockDetails from '@/components/livestock-details';
import { getAnimalIds, getAnimal } from '@/lib/data';
import type { Livestock } from '@/lib/types';

export default function Home() {
  const animalIds = useMemo(() => getAnimalIds(), []);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const animals = useMemo(() => {
    return animalIds.map(id => getAnimal(id)).filter(animal => animal !== undefined) as Livestock[];
  }, [animalIds]);

  useEffect(() => {
    setIsClient(true);
    if (animalIds.length > 0) {
      setSelectedAnimalId(animalIds[0]);
    }
  }, [animalIds]);

  if (!isClient) {
    return null;
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <SidebarProvider>
        <LivestockSidebar
          animals={animals}
          selectedAnimalId={selectedAnimalId}
          onSelect={setSelectedAnimalId}
        />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            {selectedAnimalId ? (
              <LivestockDetails key={selectedAnimalId} animalId={selectedAnimalId} />
            ) : (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">Select an animal to view details</p>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
