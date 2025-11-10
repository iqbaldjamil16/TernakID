'use client'

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Livestock, Pedigree, Dam, Sire } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
}

export function PedigreeTab({ animal, onUpdate }: PedigreeTabProps) {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<'dam' | 'sire' | null>(null);
  
  // Create a ref to hold a function that can get the current form data
  const getFormDataRef = useRef<() => Dam | Sire | {}>(() => ({}));


  const handleOpenModal = (entityType: 'dam' | 'sire') => {
    setEditingEntity(entityType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEntity(null);
    setIsModalOpen(false);
  };

  const handleSave = (updatedData: Partial<Dam> | Partial<Sire>) => {
    if (!editingEntity) return;

    // Get the latest form data using the function from the ref,
    // and combine it with the partial update (e.g., from a photo upload).
    const currentFormData = getFormDataRef.current();
    const finalData = { ...currentFormData, ...updatedData };
    
    const updatedPedigree = {
      ...animal.pedigree,
      [editingEntity]: finalData,
    };
    
    onUpdate({ pedigree: updatedPedigree as Pedigree });
    // Toast is now more general since this function handles both text and photo saves.
    handleCloseModal();
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
                          <DialogHeader className="sr-only">
                            <DialogTitle>Foto Induk: {dam?.name || 'Induk'}</DialogTitle>
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
                          <DialogHeader className="sr-only">
                            <DialogTitle>Foto Pejantan: {sire?.name || 'Pejantan'}</DialogTitle>
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
        />
      )}
    </div>
  );
}
