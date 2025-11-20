
'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInput,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Leaf, Search, Loader, PlusCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import type { Livestock } from '@/lib/types';
import { Button } from './ui/button';

type LivestockSidebarProps = {
  animals: Livestock[];
  selectedAnimalId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  isPreparingData: boolean;
};

export default function LivestockSidebar({ animals, selectedAnimalId, onSelect, onAddNew, isPreparingData }: LivestockSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const filteredAnimals = useMemo(() => {
    if (!searchTerm) {
      return animals;
    }
    return animals.filter((animal) =>
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      animal.regId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [animals, searchTerm]);

  // Mobile view uses a Sheet component
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="w-full max-w-[300px] p-0"
        >
          <div className="flex h-full flex-col">
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                        <Leaf className="size-5" />
                    </div>
                    <span className="text-xl font-semibold text-primary">Data E-TernakID</span>
                </div>
                 <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <SidebarInput 
                    placeholder="Cari nama atau ID ternak..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <Button variant="outline" className="w-full justify-start text-base" onClick={onAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah Ternak Baru
                </Button>
                <SidebarSeparator className="my-2" />
                {isPreparingData && (
                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Menyiapkan data...
                  </div>
                )}
                {!isPreparingData && filteredAnimals.map((animal) => (
                  <SidebarMenuItem key={animal.id}>
                    <SidebarMenuButton
                      onClick={() => onSelect(animal.id)}
                      isActive={selectedAnimalId === animal.id}
                      className="text-lg"
                    >
                      {animal.name}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {filteredAnimals.length === 0 && !isPreparingData && (
                  <p className="px-2 text-sm text-muted-foreground">Ternak tidak ditemukan.</p>
                )}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <p className="text-xs text-muted-foreground px-2">Mode: Database Publik</p>
            </SidebarFooter>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop view
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                <Leaf className="size-5" />
            </div>
            <span className="text-xl font-semibold text-primary">Data E-TernakID</span>
        </div>
         <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <SidebarInput 
            placeholder="Cari nama atau ID ternak..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <Button variant="outline" className="w-full justify-start text-base" onClick={onAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Ternak Baru
            </Button>
            <SidebarSeparator className="my-2" />
          {isPreparingData && (
            <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Menyiapkan data...
            </div>
           )}
          {!isPreparingData && filteredAnimals.map((animal) => (
            <SidebarMenuItem key={animal.id}>
              <SidebarMenuButton
                onClick={() => onSelect(animal.id)}
                isActive={selectedAnimalId === animal.id}
                tooltip={{ children: `${animal.name} (${animal.regId})`, side: "right", align: "center" }}
                className="text-lg"
              >
                {animal.name}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
           {filteredAnimals.length === 0 && !isPreparingData && (
            <p className="px-2 text-sm text-muted-foreground">Ternak tidak ditemukan.</p>
          )}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <p className="text-xs text-muted-foreground px-2">Mode: Database Publik</p>
      </SidebarFooter>
    </Sidebar>
  );
}
