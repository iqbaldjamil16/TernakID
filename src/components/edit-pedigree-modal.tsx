'use client';

import React, { useEffect, useState, useRef, MutableRefObject } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dam, Sire } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

const damSchema = z.object({
  name: z.string().optional(),
  regId: z.string().optional(),
  breed: z.string().optional(),
  offspring: z.number().optional(),
});

const sireSchema = z.object({
  name: z.string().optional(),
  semenId: z.string().optional(),
  breed: z.string().optional(),
  characteristics: z.string().optional(),
});

type FormData = z.infer<typeof damSchema> | z.infer<typeof sireSchema>;


interface EditPedigreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'dam' | 'sire';
  entity: Partial<Dam> | Partial<Sire>;
  onSave: (data: Partial<Dam> | Partial<Sire>) => void;
  setGetFormDataRef: MutableRefObject<() => Dam | Sire | {}>;
}

export default function EditPedigreeModal({ isOpen, onClose, entityType, entity, onSave, setGetFormDataRef }: EditPedigreeModalProps) {
  const isDam = entityType === 'dam';
  const schema = isDam ? damSchema : sireSchema;
  const { toast } = useToast();

  const [photoPreview, setPhotoPreview] = useState<string | null>(entity.photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, getValues, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
        ...entity,
        offspring: 'offspring' in entity ? entity.offspring || undefined : undefined,
    },
  });

  useEffect(() => {
    // Set the ref to a function that can be called by the parent to get current form values
    setGetFormDataRef.current = () => getValues();
  }, [getValues, setGetFormDataRef]);

  useEffect(() => {
    reset({
        ...entity,
        offspring: 'offspring' in entity ? entity.offspring || undefined : undefined,
    });
    setPhotoPreview(entity.photoUrl || null);
  }, [entity, reset]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl); // Optimistic UI update
        // Immediately save the photo data
        onSave({ photoUrl: dataUrl });
        toast({
          title: "Foto Disimpan",
          description: "Foto baru sedang disimpan secara permanen.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: FormData) => {
    let processedData: Partial<Dam> | Partial<Sire>;

    if (isDam) {
        const offspringAsNumber = Number((data as Dam).offspring);
        processedData = {
          ...data,
          offspring: isNaN(offspringAsNumber) || offspringAsNumber === 0 ? undefined : offspringAsNumber
        };
    } else {
        // Explicitly construct the sire data to ensure 'offspring' is never included.
        const sireData = data as Partial<Sire>;
        processedData = {
            name: sireData.name,
            semenId: sireData.semenId,
            breed: sireData.breed,
            characteristics: sireData.characteristics
        };
    }
    
    onSave(processedData);
    toast({
        title: 'Sukses',
        description: `Data teks untuk ${isDam ? 'Induk' : 'Pejantan'} berhasil diperbarui.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Data {isDam ? 'Induk (Dam)' : 'Pejantan (Sire)'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
             <div className="flex flex-col items-center gap-4">
               <Image
                  src={photoPreview || `https://picsum.photos/seed/placeholder-${entityType}/200`}
                  alt={`Foto ${isDam ? 'Induk' : 'Pejantan'}`}
                  width={128}
                  height={128}
                  className="rounded-full object-cover w-32 h-32 border-2"
              />
               <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  ref={fileInputRef}
              />
               <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Unggah Foto
              </Button>
            </div>

            {isDam ? (
              <>
                <div>
                  <Label htmlFor="name">Nama Induk</Label>
                  <Input id="name" {...register('name')} placeholder="Cth: SITI" />
                </div>
                <div>
                  <Label htmlFor="regId">No. Registrasi Induk</Label>
                  <Input id="regId" {...register('regId')} placeholder="Cth: SB001-2019-SITI" />
                </div>
                <div>
                  <Label htmlFor="breed">Bangsa/Ras</Label>
                  <Input id="breed" {...register('breed')} placeholder="Cth: Lokal Madura" />
                </div>
                <div>
                  <Label htmlFor="offspring">Jumlah Kelahiran Anak</Label>
                  <Input id="offspring" type="number" {...register('offspring', { setValueAs: (v) => v === "" ? undefined : parseInt(v, 10) })} placeholder="Cth: 3" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="name">Nama Pejantan/Semen</Label>
                  <Input id="name" {...register('name')} placeholder="Cth: JAKA" />
                </div>
                <div>
                  <Label htmlFor="semenId">No. Reg Semen/ID Pejantan</Label>
                  <Input id="semenId" {...register('semenId')} placeholder="Cth: IB-05-BCX" />
                </div>
                <div>
                  <Label htmlFor="breed">Bangsa/Ras</Label>
                  <Input id="breed" {...register('breed')} placeholder="Cth: Brahman Cross Murni" />
                </div>
                <div>
                  <Label htmlFor="characteristics">Karakteristik Utama</Label>
                  <Textarea id="characteristics" {...register('characteristics')} placeholder="Cth: Potensi otot besar, pertumbuhan cepat" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Batal</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
