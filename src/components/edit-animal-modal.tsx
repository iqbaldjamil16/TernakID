'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useForm, Controller } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

const editSchema = z.object({
  name: z.string().min(1, 'Nama ternak harus diisi'),
  breed: z.string().min(1, 'Jenis bangsa harus diisi'),
  gender: z.enum(['Jantan', 'Betina'], { required_error: 'Jenis kelamin harus dipilih' }),
  status: z.string().min(1, 'Status harus diisi'),
  address: z.string().min(1, 'Alamat harus diisi'),
  owner: z.string().min(1, 'Nama pemilik harus diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir harus diisi'),
  // photoUrl is handled separately now
});

type EditFormData = z.infer<typeof editSchema>;

interface EditAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Livestock;
  onSave: (data: Partial<Omit<Livestock, 'id' | 'photoUrl'>>) => void;
  onSavePhoto: (photoUrl: string) => void;
}

export default function EditAnimalModal({ isOpen, onClose, animal, onSave, onSavePhoto }: EditAnimalModalProps) {
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(animal.photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditFormData>({
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

  useEffect(() => {
    // Reset form and photo preview when the animal prop changes
    reset({
      name: animal.name,
      breed: animal.breed,
      gender: animal.gender,
      status: animal.status,
      address: animal.address,
      owner: animal.owner,
      birthDate: formatToYYYYMMDD(animal.birthDate),
    });
    setPhotoPreview(animal.photoUrl || null);
  }, [animal, reset]);


  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoPreview(dataUrl); // Optimistically update preview
        onSavePhoto(dataUrl); // Immediately save photo to the database
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: EditFormData) => {
    const updatedData: Partial<Omit<Livestock, 'id'>> = {
      ...data,
      birthDate: new Date(data.birthDate),
    };

    onSave(updatedData);
    toast({
      title: 'Perubahan Disimpan',
      description: `Detail teks untuk ${animal.name} berhasil diperbarui.`,
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
            <div className="flex flex-col items-center gap-4">
              <Image
                  src={photoPreview || `https://picsum.photos/seed/${animal.id}/200/200`}
                  alt="Foto Ternak"
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
              <Label>Jenis Kelamin</Label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Jantan" id="jantan" />
                      <Label htmlFor="jantan">Jantan</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Betina" id="betina" />
                      <Label htmlFor="betina">Betina</Label>
                    </div>
                  </RadioGroup>
                )}
              />
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
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Teks'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
