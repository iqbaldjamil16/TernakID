'use client'

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Livestock, Pedigree } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Save } from 'lucide-react';

const pedigreeSchema = z.object({
  dam: z.object({
    name: z.string().optional(),
    regId: z.string().optional(),
    breed: z.string().optional(),
    offspring: z.number().optional(),
  }),
  sire: z.object({
    name: z.string().optional(),
    semenId: z.string().optional(),
    breed: z.string().optional(),
    characteristics: z.string().optional(),
  })
});

type PedigreeFormData = z.infer<typeof pedigreeSchema>;

interface PedigreeTabProps {
  animal: Livestock;
  onUpdate: (data: { pedigree: Pedigree }) => void;
}

export function PedigreeTab({ animal, onUpdate }: PedigreeTabProps) {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm<PedigreeFormData>({
    resolver: zodResolver(pedigreeSchema),
    defaultValues: {
        dam: {
            name: animal.pedigree.dam.name || '',
            regId: animal.pedigree.dam.regId || '',
            breed: animal.pedigree.dam.breed || '',
            offspring: animal.pedigree.dam.offspring || 0,
        },
        sire: {
            name: animal.pedigree.sire.name || '',
            semenId: animal.pedigree.sire.semenId || '',
            breed: animal.pedigree.sire.breed || '',
            characteristics: animal.pedigree.sire.characteristics || '',
        }
    }
  });

  const onSubmit = (data: PedigreeFormData) => {
    onUpdate({ pedigree: data as Pedigree });
    toast({
      title: 'Sukses',
      description: 'Data silsilah induk berhasil disimpan.',
    });
  };

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
                    <h3 className="font-bold text-pink-700 text-lg mb-2">Induk (Dam)</h3>
                    <ul className="text-sm space-y-1 text-gray-700">
                        <li><span className="font-semibold">Nama:</span> {animal.pedigree.dam.name || '-'}</li>
                        <li><span className="font-semibold">No. Reg:</span> {animal.pedigree.dam.regId || '-'}</li>
                        <li><span className="font-semibold">Bangsa/Ras:</span> {animal.pedigree.dam.breed || '-'}</li>
                        <li><span className="font-semibold">Jml Anak:</span> {animal.pedigree.dam.offspring ?? '-'}</li>
                    </ul>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h3 className="font-bold text-indigo-700 text-lg mb-2">Pejantan (Sire)</h3>
                     <ul className="text-sm space-y-1 text-gray-700">
                        <li><span className="font-semibold">Nama/Semen:</span> {animal.pedigree.sire.name || '-'}</li>
                        <li><span className="font-semibold">No. Semen/ID:</span> {animal.pedigree.sire.semenId || '-'}</li>
                        <li><span className="font-semibold">Bangsa/Ras:</span> {animal.pedigree.sire.breed || '-'}</li>
                        <li><span className="font-semibold">Karakteristik:</span> {animal.pedigree.sire.characteristics || '-'}</li>
                    </ul>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulir Input Silsilah</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 bg-pink-50/50 rounded-lg border">
                <p className="font-bold text-pink-700 text-lg">Induk (Dam)</p>
                <div>
                  <label className="text-sm font-medium">Nama Induk</label>
                  <Input {...register('dam.name')} placeholder="Cth: SITI" />
                </div>
                <div>
                  <label className="text-sm font-medium">No. Registrasi Induk</label>
                  <Input {...register('dam.regId')} placeholder="Cth: SB001-2019-SITI" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bangsa/Ras</label>
                  <Input {...register('dam.breed')} placeholder="Cth: Lokal Madura" />
                </div>
                <div>
                  <label className="text-sm font-medium">Jumlah Kelahiran Anak</label>
                  <Input type="number" {...register('dam.offspring', { valueAsNumber: true })} placeholder="Cth: 3" />
                </div>
              </div>

              <div className="space-y-4 p-4 bg-indigo-50/50 rounded-lg border">
                <p className="font-bold text-indigo-700 text-lg">Pejantan (Sire)</p>
                <div>
                  <label className="text-sm font-medium">Nama Pejantan/Semen</label>
                  <Input {...register('sire.name')} placeholder="Cth: JAKA" />
                </div>
                <div>
                  <label className="text-sm font-medium">No. Reg Semen/ID Pejantan</label>
                  <Input {...register('sire.semenId')} placeholder="Cth: IB-05-BCX" />
                </div>
                <div>
                  <label className="text-sm font-medium">Bangsa/Ras</label>
                  <Input {...register('sire.breed')} placeholder="Cth: Brahman Cross Murni" />
                </div>
                <div>
                  <label className="text-sm font-medium">Karakteristik Utama</label>
                  <Textarea {...register('sire.characteristics')} placeholder="Cth: Potensi otot besar, pertumbuhan cepat" />
                </div>
              </div>
            </div>
            <Separator />
            <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Simpan Silsilah
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
