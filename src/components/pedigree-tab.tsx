
'use client'

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Livestock, Pedigree, Dam, Sire } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { Pencil } from 'lucide-react';
import EditPedigreeModal from './edit-pedigree-modal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PedigreeTabProps {
  animal: Livestock;
  onUpdate: (data: { pedigree: Pedigree }) => void;
  withPasswordProtection: (action: () => void) => void;
}

export function PedigreeTab({ animal, onUpdate, withPasswordProtection }: PedigreeTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<'dam' | 'sire' | null>(null);
  
  // This ref holds a function to get the current form data from the modal.
  const getFormDataRef = useRef<() => Partial<Dam> | Partial<Sire>>(() => ({}));

  const dam = animal.pedigree?.dam;
  const sire = animal.pedigree?.sire;


  const handleOpenModal = (entityType: 'dam' | 'sire') => {
    withPasswordProtection(() => {
        setEditingEntity(entityType);
        setIsModalOpen(true);
    });
  };

  const handleCloseModal = () => {
    setEditingEntity(null);
    setIsModalOpen(false);
  };

  // This function is now robust. It handles both text and photo updates.
  const handleSave = (updatedData: Partial<Dam> | Partial<Sire>) => {
    if (!editingEntity) return;

    // Get the latest text data from the form inside the modal.
    const currentFormData = getFormDataRef.current();
    
    // Get the existing data for the entity being edited.
    const existingEntityData = animal.pedigree?.[editingEntity] || {};

    // Merge everything: existing data + current form text + the new update (e.g., photo).
    // This ensures no data is lost.
    const finalData = { ...existingEntityData, ...currentFormData, ...updatedData };
    
    const updatedPedigree = {
      ...animal.pedigree,
      [editingEntity]: finalData,
    };
    
    // Send the complete, merged pedigree object for update.
    onUpdate({ pedigree: updatedPedigree as Pedigree });
    
    // Only close the modal if it wasn't just a photo upload,
    // which happens in the background.
    if (!('photoUrl' in updatedData)) {
      handleCloseModal();
    }
  };

  const entityToEdit = editingEntity ? (animal.pedigree?.[editingEntity] || {}) : {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Silsilah (Pedigree)</CardTitle>
          <CardDescription>Data silsilah terintegrasi penting untuk program peningkatan mutu genetik.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dam Card */}
                <div className="p-4 bg-pink-50 rounded-lg border border-pink-200 flex flex-col sm:flex-row gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="w-24 h-24 rounded-full border-2 border-pink-200 object-cover mx-auto sm:mx-0 cursor-pointer flex-shrink-0">
                           <Image
                            src={dam?.photoUrl || `https://picsum.photos/seed/dam-${animal.id}/200`}
                            alt="Foto Induk"
                            width={96}
                            height={96}
                            className="rounded-full w-full h-full object-cover"
                            data-ai-hint="livestock animal"
                          />
                        </div>
                      </DialogTrigger>
                       <DialogContent className="p-0 max-w-xl bg-transparent border-0">
                          <DialogHeader>
                            <DialogTitle className="sr-only">Foto Induk: {dam?.name || 'Induk'}</DialogTitle>
                          </DialogHeader>
                          <Image
                            src={dam?.photoUrl || `https://picsum.photos/seed/dam-${animal.id}/600`}
                            alt="Foto Induk"
                            width={600}
                            height={600}
                            className="rounded-lg object-contain w-full h-full"
                          />
                      </DialogContent>
                    </Dialog>
                    <div className='flex-grow'>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-pink-700 text-lg">Induk (Dam)</h3>
                            <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleOpenModal('dam')}>
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
                </div>

                {/* Sire Card */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 flex flex-col sm:flex-row gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                         <div className="w-24 h-24 rounded-full border-2 border-indigo-200 object-cover mx-auto sm:mx-0 cursor-pointer flex-shrink-0">
                          <Image
                            src={sire?.photoUrl || `https://picsum.photos/seed/sire-${animal.id}/200`}
                            alt="Foto Pejantan"
                            width={96}
                            height={96}
                            className="rounded-full w-full h-full object-cover"
                            data-ai-hint="livestock animal"
                          />
                        </div>
                      </DialogTrigger>
                       <DialogContent className="p-0 max-w-xl bg-transparent border-0">
                          <DialogHeader>
                            <DialogTitle className="sr-only">Foto Pejantan: {sire?.name || 'Pejantan'}</DialogTitle>
                          </DialogHeader>
                          <Image
                            src={sire?.photoUrl || `https://picsum.photos/seed/sire-${animal.id}/600`}
                            alt="Foto Pejantan"
                            width={600}
                            height={600}
                            className="rounded-lg object-contain w-full h-full"
                          />
                      </DialogContent>
                    </Dialog>
                    <div className='flex-grow'>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-indigo-700 text-lg">Pejantan (Sire)</h3>
                            <Button variant="ghost" size="icon" className='h-8 w-8' onClick={() => handleOpenModal('sire')}>
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
            setGetFormDataRef={getFormDataRef}
            withPasswordProtection={withPasswordProtection}
        />
      )}
    </div>
  );
}
