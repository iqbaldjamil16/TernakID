'use client';

import React, { useEffect } from 'react';
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

type DamFormData = z.infer<typeof damSchema>;
type SireFormData = z.infer<typeof sireSchema>;

interface EditPedigreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'dam' | 'sire';
  entity: Partial<Dam> | Partial<Sire>;
  onSave: (data: Partial<Dam> | Partial<Sire>) => void;
}

export default function EditPedigreeModal({ isOpen, onClose, entityType, entity, onSave }: EditPedigreeModalProps) {
  const isDam = entityType === 'dam';
  const schema = isDam ? damSchema : sireSchema;

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: entity,
  });

  useEffect(() => {
    reset(entity);
  }, [entity, reset]);

  const onSubmit = (data: DamFormData | SireFormData) => {
    if (isDam) {
        const offspringAsNumber = Number((data as DamFormData).offspring);
        const updatedData = {
          ...data,
          offspring: isNaN(offspringAsNumber) || offspringAsNumber === 0 ? undefined : offspringAsNumber
        };
        onSave(updatedData);
    } else {
        onSave(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Data {isDam ? 'Induk (Dam)' : 'Pejantan (Sire)'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
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
