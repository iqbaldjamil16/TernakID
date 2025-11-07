'use client'

import React, { useState } from 'react';
import { Livestock, Pedigree, Dam, Sire } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Pencil } from 'lucide-react';
import EditPedigreeModal from './edit-pedigree-modal';

interface PedigreeTabProps {
  animal: Livestock;
  onUpdate: (data: { pedigree: Pedigree }) => void;
}

export function PedigreeTab({ animal, onUpdate }: PedigreeTabProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<'dam' | 'sire' | null>(null);

  const handleOpenModal = (entityType: 'dam' | 'sire') => {
    setEditingEntity(entityType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEntity(null);
    setIsModalOpen(false);
  };

  const handleSave = (updatedEntityData: Partial<Dam> | Partial<Sire>) => {
    if (!editingEntity) return;

    const updatedPedigree = {
      ...animal.pedigree,
      [editingEntity]: {
        ...animal.pedigree?.[editingEntity],
        ...updatedEntityData,
      },
    };

    onUpdate({ pedigree: updatedPedigree as Pedigree });
    toast({
      title: 'Sukses',
      description: `Data ${editingEntity === 'dam' ? 'Induk' : 'Pejantan'} berhasil diperbarui.`,
    });
    handleCloseModal();
  };

  const dam = animal.pedigree?.dam;
  const sire = animal.pedigree?.sire;

  const entityToEdit = editingEntity ? (animal.pedigree?.[editingEntity] || {}) : {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Silsilah (Pedigree)</CardTitle>
          <CardDescription>Data silsilah terintegrasi penting untuk program peningkatan mutu genetik.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-pink-700 text-lg">Induk (Dam)</h3>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal('dam')}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                    <ul className="text-sm space-y-1 text-gray-700">
                        <li><span className="font-semibold">Nama:</span> {dam?.name || '-'}</li>
                        <li><span className="font-semibold">No. Reg:</span> {dam?.regId || '-'}</li>
                        <li><span className="font-semibold">Bangsa/Ras:</span> {dam?.breed || '-'}</li>
                        <li><span className="font-semibold">Jml Anak:</span> {dam?.offspring ?? '-'}</li>
                    </ul>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-indigo-700 text-lg">Pejantan (Sire)</h3>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal('sire')}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                     <ul className="text-sm space-y-1 text-gray-700">
                        <li><span className="font-semibold">Nama/Semen:</span> {sire?.name || '-'}</li>
                        <li><span className="font-semibold">No. Semen/ID:</span> {sire?.semenId || '-'}</li>
                        <li><span className="font-semibold">Bangsa/Ras:</span> {sire?.breed || '-'}</li>
                        <li><span className="font-semibold">Karakteristik:</span> {sire?.characteristics || '-'}</li>
                    </ul>
                </div>
            </div>
        </CardContent>
      </Card>
      
      {editingEntity && (
        <EditPedigreeModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            entityType={editingEntity}
            entity={entityToEdit}
            onSave={handleSave}
        />
      )}
    </div>
  );
}
