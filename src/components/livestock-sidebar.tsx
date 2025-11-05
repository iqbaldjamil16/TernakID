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
} from '@/components/ui/sidebar';
import { Leaf, Search } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import type { Livestock } from '@/lib/types';

type LivestockSidebarProps = {
  animals: Livestock[];
  selectedAnimalId: string | null;
  onSelect: (id: string) => void;
};

export default function LivestockSidebar({ animals, selectedAnimalId, onSelect }: LivestockSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnimals = useMemo(() => {
    if (!searchTerm) {
      return animals;
    }
    return animals.filter((animal) =>
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      animal.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [animals, searchTerm]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                <Leaf className="size-5" />
            </div>
            <span className="text-lg font-semibold text-primary">Data E-TernakID</span>
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
          {filteredAnimals.map((animal) => (
            <SidebarMenuItem key={animal.id}>
              <SidebarMenuButton
                onClick={() => onSelect(animal.id)}
                isActive={selectedAnimalId === animal.id}
                tooltip={{ children: `${animal.name} (${animal.id})`, side: "right", align: "center" }}
              >
                {animal.name}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
           {filteredAnimals.length === 0 && (
            <p className="px-2 text-sm text-muted-foreground">Ternak tidak ditemukan.</p>
          )}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <p className="text-xs text-muted-foreground px-2">UserID: <span className="font-mono text-xs">user-12345</span></p>
      </SidebarFooter>
    </Sidebar>
  );
}
