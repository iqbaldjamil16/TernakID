'use client'

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ReproductionLog, Livestock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const reproductionLogSchema = z.object({
  type: z.enum(['Inseminasi Buatan (IB)', 'Kawin Alami', 'Kebuntingan Dideteksi', 'Melahirkan', 'Kelahiran', 'Abortus', 'Lainnya']),
  date: z.string().min(1, 'Tanggal harus diisi'),
  detail: z.string().min(1, 'Detail harus diisi'),
  notes: z.string().optional(),
});

type ReproductionLogFormData = z.infer<typeof reproductionLogSchema>;

interface ReproductionTabProps {
  animal: Livestock;
  onAddLog: (log: Omit<ReproductionLog, 'date'> & { date: string }) => void;
}

export function ReproductionTab({ animal, onAddLog }: ReproductionTabProps) {
  const { toast } = useToast();
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ReproductionLogFormData>({
    resolver: zodResolver(reproductionLogSchema),
    defaultValues: { type: 'Inseminasi Buatan (IB)', notes: '' }
  });

  const onSubmit = (data: ReproductionLogFormData) => {
    onAddLog(data as Omit<ReproductionLog, 'date'> & { date: string });
    toast({
      title: 'Sukses',
      description: 'Catatan reproduksi berhasil disimpan.',
    });
    reset();
  };
  
  const sortedLog = [...animal.reproductionLog].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan Reproduksi Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Jenis Peristiwa</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inseminasi Buatan (IB)">Inseminasi Buatan (IB)</SelectItem>
                        <SelectItem value="Kawin Alami">Kawin Alami</SelectItem>
                        <SelectItem value="Kebuntingan Dideteksi">Kebuntingan Dideteksi</SelectItem>
                        <SelectItem value="Melahirkan">Melahirkan</SelectItem>
                        <SelectItem value="Kelahiran">Kelahiran</SelectItem>
                        <SelectItem value="Abortus">Abortus</SelectItem>
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
            <div>
              <label>Detail (ID Batch & Pejantan/Hasil PKB/Nama Anak dll)</label>
              <Input placeholder="Cth: Semen ID: IB-05-BCX" {...register('detail')} />
              {errors.detail && <p className="text-destructive text-sm mt-1">{errors.detail.message}</p>}
            </div>
            <div>
              <label>Keterangan (Opsional)</label>
              <Textarea placeholder="Cth: Birahi malam, IB sukses dilakukan pagi hari." {...register('notes')} />
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
          <CardTitle>Daftar Riwayat Peristiwa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Peristiwa</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLog.length > 0 ? sortedLog.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{log.date.toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>{log.detail}</TableCell>
                    <TableCell>{log.notes || '-'}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada riwayat reproduksi.
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
