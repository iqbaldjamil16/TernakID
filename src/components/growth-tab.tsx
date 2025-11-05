'use client'

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GrowthRecord, Livestock } from '@/lib/types';
import { calculateADG } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const growthRecordSchema = z.object({
  weight: z.number({ invalid_type_error: 'Bobot harus angka' }).positive('Bobot harus lebih dari 0'),
});

type GrowthRecordFormData = z.infer<typeof growthRecordSchema>;

interface GrowthTabProps {
  animal: Livestock;
  onAddRecord: (record: Omit<GrowthRecord, 'date' | 'adg'>) => void;
}

export function GrowthTab({ animal, onAddRecord }: GrowthTabProps) {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<GrowthRecordFormData>({
    resolver: zodResolver(growthRecordSchema),
  });

  const { average: avgADG, records: growthRecordsWithADG } = useMemo(() => calculateADG(animal.growthRecords), [animal.growthRecords]);
  const latestWeight = growthRecordsWithADG.length > 0 ? growthRecordsWithADG[growthRecordsWithADG.length - 1].weight : 'N/A';

  const onSubmit = (data: GrowthRecordFormData) => {
    const latestRecordWeight = typeof latestWeight === 'number' ? latestWeight : 0;
    if (data.weight <= latestRecordWeight) {
        toast({
            variant: "destructive",
            title: "Error",
            description: `Bobot harus lebih besar dari bobot terakhir (${latestRecordWeight} kg).`,
        });
        return;
    }
    onAddRecord({ weight: data.weight });
    toast({
      title: 'Sukses',
      description: `Bobot ${data.weight} kg berhasil disimpan.`,
    });
    reset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Catat Bobot Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:w-2/3">
              <Input type="number" placeholder="Bobot (kg)" {...register('weight', { valueAsNumber: true })} />
              {errors.weight && <p className="text-destructive text-sm mt-1">{errors.weight.message}</p>}
            </div>
            <Button type="submit" className="w-full sm:w-1/3">
              <Save className="mr-2 h-4 w-4" />
              Simpan Bobot
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-purple-50 border-purple-300">
        <CardHeader>
            <CardTitle className="text-purple-700">ADG (Average Daily Gain)</CardTitle>
            <CardDescription>Bobot terakhir: <strong>{latestWeight} kg</strong></CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-2xl font-bold text-purple-700">{avgADG} kg/hari</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pertumbuhan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Timbang</TableHead>
                  <TableHead>Bobot (kg)</TableHead>
                  <TableHead>ADG (kg/hari)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {growthRecordsWithADG.length > 0 ? growthRecordsWithADG.reverse().map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.date.toLocaleDateString('id-ID')}</TableCell>
                    <TableCell className="font-medium">{record.weight}</TableCell>
                    <TableCell>{record.adg}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada data pertumbuhan.
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
