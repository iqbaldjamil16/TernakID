'use client'

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { HealthLog, Livestock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const healthLogSchema = z.object({
  type: z.enum(['Vaksinasi', 'Penyakit', 'Pengobatan', 'Lainnya']),
  date: z.string().min(1, 'Tanggal harus diisi'),
  vaccineOrMedicineName: z.string().optional(),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
    if (data.type === 'Penyakit' && !data.diagnosis) {
        return false;
    }
    if ((data.type === 'Vaksinasi' || data.type === 'Pengobatan') && !data.vaccineOrMedicineName) {
        return false;
    }
    return true;
}, {
    message: "Detail harus diisi sesuai jenis catatan",
    path: ['diagnosis'], // Point to a field to display the general error.
});

type HealthLogFormData = z.infer<typeof healthLogSchema>;

interface HealthTabProps {
  animal: Livestock;
  onAddLog: (log: Omit<HealthLog, 'date'> & { date: string }) => void;
}

export function HealthTab({ animal, onAddLog }: HealthTabProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<HealthLogFormData>({
    resolver: zodResolver(healthLogSchema),
    defaultValues: { type: 'Vaksinasi', notes: '', diagnosis: '', vaccineOrMedicineName: '' }
  });

  const selectedType = watch('type');

  const onSubmit = (data: HealthLogFormData) => {
    onAddLog(data as Omit<HealthLog, 'date'> & { date: string });
    toast({
      title: 'Sukses',
      description: 'Catatan kesehatan berhasil disimpan.',
    });
    reset();
  };

  const sortedLog = [...animal.healthLog].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan Kesehatan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Jenis Catatan</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vaksinasi">Vaksinasi</SelectItem>
                        <SelectItem value="Penyakit">Penyakit</SelectItem>
                        <SelectItem value="Pengobatan">Pengobatan</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div>
                <label>Tanggal</label>
                <Input type="date" {...register('date')} />
                {errors.date && <p className="text-destructive text-sm mt-1">{errors.date.message}</p>}
              </div>
            </div>
            
            {(selectedType === 'Vaksinasi' || selectedType === 'Pengobatan') && (
              <div>
                <label>Nama Vaksin / Obat</label>
                <Input placeholder={selectedType === 'Vaksinasi' ? "Cth: PMK Dosis 2" : "Cth: Antibiotik X"} {...register('vaccineOrMedicineName')} />
                {errors.vaccineOrMedicineName && <p className="text-destructive text-sm mt-1">{errors.vaccineOrMedicineName.message}</p>}
              </div>
            )}

            {selectedType === 'Penyakit' && (
              <div>
                <label>Gejala/Diagnosa</label>
                <Input placeholder="Cth: Diare, nafsu makan turun" {...register('diagnosis')} />
                 {errors.diagnosis && <p className="text-destructive text-sm mt-1">{errors.diagnosis.message}</p>}
              </div>
            )}
            
            <div>
              <label>Keterangan</label>
              <Textarea placeholder="Cth: Diberikan obat anti-bloat oral" {...register('notes')} />
            </div>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Simpan Catatan
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Riwayat Kesehatan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Vaksin/Obat</TableHead>
                  <TableHead>Diagnosa/Gejala</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLog.length > 0 ? sortedLog.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{log.date.toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>{log.vaccineOrMedicineName || '-'}</TableCell>
                    <TableCell>{log.diagnosis || '-'}</TableCell>
                    <TableCell>{log.notes || '-'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada riwayat kesehatan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
