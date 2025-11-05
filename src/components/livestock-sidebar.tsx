'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Leaf } from 'lucide-react';
import React from 'react';

type LivestockSidebarProps = {
  animalIds: string[];
  selectedAnimalId: string | null;
  onSelect: (id: string) => void;
};

export default function LivestockSidebar({ animalIds, selectedAnimalId, onSelect }: LivestockSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                <Leaf className="size-5" />
            </div>
            <span className="text-lg font-semibold text-primary">E-TernakID</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {animalIds.map((id) => (
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
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
        <p className="text-xs text-muted-foreground px-2">UserID: <span className="font-mono text-xs">user-12345</span></p>
      </SidebarFooter>
    </Sidebar>
  );
}
