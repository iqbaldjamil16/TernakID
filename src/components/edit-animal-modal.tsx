'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Livestock } from '@/lib/types';
import { formatToYYYYMMDD } from '@/lib/utils';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const editSchema = z.object({
  name: z.string().min(1, 'Nama ternak harus diisi'),
  breed: z.string().min(1, 'Jenis bangsa harus diisi'),
  gender: z.enum(['Jantan', 'Betina']),
  status: z.string().min(1, 'Status harus diisi'),
  address: z.string().min(1, 'Alamat harus diisi'),
  owner: z.string().min(1, 'Nama pemilik harus diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir harus diisi'),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Livestock;
  onSave: (data: Partial<Livestock>) => void;
}

export default function EditAnimalModal({ isOpen, onClose, animal, onSave }: EditAnimalModalProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: animal.name,
      breed: animal.breed,
      gender: animal.gender,
      status: animal.status,
      address: animal.address,
      owner: animal.owner,
      birthDate: formatToYYYYMMDD(animal.birthDate),
    },
  });

  const onSubmit = (data: EditFormData) => {
    const updatedData: Partial<Livestock> = {
      ...data,
      birthDate: new Date(data.birthDate),
    };
    onSave(updatedData);
    toast({
      title: 'Perubahan Disimpan',
      description: `Detail untuk ${animal.name} berhasil diperbarui.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Detail Identitas Ternak</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
             <div>
                <Label htmlFor="name">Nama Ternak</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="breed">Jenis Bangsa</Label>
                <Input id="breed" {...register('breed')} />
                {errors.breed && <p className="text-destructive text-sm mt-1">{errors.breed.message}</p>}
              </div>
              <div>
                <Label htmlFor="birthDate">Tanggal Lahir</Label>
                <Input id="birthDate" type="date" {...register('birthDate')} />
                {errors.birthDate && <p className="text-destructive text-sm mt-1">{errors.birthDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="owner">Nama Pemilik</Label>
                <Input id="owner" {...register('owner')} />
                {errors.owner && <p className="text-destructive text-sm mt-1">{errors.owner.message}</p>}
              </div>
              <div>
                <Label htmlFor="address">Alamat Peternakan</Label>
                <Textarea id="address" {...register('address')} />
                {errors.address && <p className="text-destructive text-sm mt-1">{errors.address.message}</p>}
              </div>
              <div>
                <Label htmlFor="gender">Jenis Kelamin</Label>
                 <select
                  id="gender"
                  {...register('gender')}
                  defaultValue={animal.gender}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Jantan">Jantan</option>
                  <option value="Betina">Betina</option>
                </select>
                {errors.gender && <p className="text-destructive text-sm mt-1">{errors.gender.message}</p>}
              </div>
              <div>
                <Label htmlFor="status">Status Ternak</Label>
                <Input id="status" {...register('status')} />
                {errors.status && <p className="text-destructive text-sm mt-1">{errors.status.message}</p>}
              </div>
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
