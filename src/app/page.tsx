'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import LivestockSidebar from '@/components/livestock-sidebar';
import LivestockDetails from '@/components/livestock-details';
import { createDefaultAnimals, listenToAnimals, createNewAnimal } from '@/lib/data';
import type { Livestock } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PasswordPrompt } from '@/components/ui/password-prompt';

export default function Home() {
  const [allAnimals, setAllAnimals] = useState<Livestock[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState<(() => void) | null>(null);

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
        // Cek jika ada ternak, pilih yang pertama, jika tidak set ke null
        setSelectedAnimalId(animals.length > 0 ? animals[0].id : null);
      }
    });

    // Membersihkan listener saat komponen tidak lagi digunakan.
    return () => unsubscribe();
  }, [selectedAnimalId]); // Dependensi ditambahkan untuk memastikan logika pemilihan ulang berjalan jika diperlukan.


  const handleSelectAnimal = useCallback((id: string) => {
    setSelectedAnimalId(id);
  }, []);
  
  const handleAddNewAnimal = useCallback(() => {
    const action = async () => {
      try {
        const newAnimalId = await createNewAnimal();
        toast({
          title: 'Ternak Baru Ditambahkan',
          description: `Ternak dengan ID ${newAnimalId} berhasil dibuat.`,
        });
        setSelectedAnimalId(newAnimalId);
      } catch (error) {
        console.error("Gagal menambah ternak baru:", error);
        toast({
          variant: "destructive",
          title: "Gagal Menambah Ternak",
          description: "Terjadi kesalahan saat mencoba membuat ternak baru.",
        });
      }
    };
    
    setPasswordAction(() => action);
    setIsPasswordPromptOpen(true);
  }, [toast]);
  
  const handlePasswordConfirm = () => {
    if (passwordAction) {
      passwordAction();
    }
    setIsPasswordPromptOpen(false);
    setPasswordAction(null);
  };

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
          onAddNew={handleAddNewAnimal}
          isPreparingData={!isDataReady}
        />
        <SidebarInset>
          <div className="p-4 sm:p-6 lg:p-8">
            {!isDataReady && allAnimals.length === 0 ? (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">Sedang menyiapkan data ternak awal...</p>
              </div>
            ) : selectedAnimal ? (
              <LivestockDetails key={selectedAnimal.id} animal={selectedAnimal} />
            ) : (
              <div className="flex h-[80vh] items-center justify-center rounded-xl bg-card shadow-sm">
                <p className="text-muted-foreground">Pilih ternak dari daftar untuk melihat detail, atau tambah ternak baru.</p>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <PasswordPrompt
        isOpen={isPasswordPromptOpen}
        onClose={() => setIsPasswordPromptOpen(false)}
        onConfirm={handlePasswordConfirm}
      />
    </div>
  );
}
