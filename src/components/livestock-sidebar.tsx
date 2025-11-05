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

type LivestockSidebarProps = {
  animalIds: string[];
  selectedAnimalId: string | null;
  onSelect: (id: string) => void;
};

export default function LivestockSidebar({ animalIds, selectedAnimalId, onSelect }: LivestockSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnimalIds = useMemo(() => {
    if (!searchTerm) {
      return animalIds;
    }
    return animalIds.filter((id) =>
      id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [animalIds, searchTerm]);

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
            placeholder="Cari data ternak..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredAnimalIds.map((id) => (
            <SidebarMenuItem key={id}>
              <SidebarMenuButton
                onClick={() => onSelect(id)}
                isActive={selectedAnimalId === id}
                tooltip={{ children: `Ternak #${id.split('-')[1]}`, side: "right", align: "center" }}
              >
                Ternak #{id.split('-')[1]} ({id})
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
           {filteredAnimalIds.length === 0 && (
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
