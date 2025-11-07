'use client'

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ReproductionLog, Livestock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatToYYYYMMDD } from '@/lib/utils';

const reproductionLogSchema = z.object({
  date: z.string().min(1, 'Tanggal harus diisi.'),
  type: z.enum(['Inseminasi Buatan (IB)', 'Kawin Alami', 'Kebuntingan Dideteksi', 'Melahirkan', 'Kelahiran', 'Abortus', 'Lainnya']),
  detail: z.string().min(1, 'Detail harus diisi'),
  notes: z.string().optional(),
});

type ReproductionLogFormData = z.infer<typeof reproductionLogSchema>;

interface ReproductionTabProps {
  animal: Livestock;
  onAddLog: (log: Omit<ReproductionLog, 'id'>) => void;
  onUpdateLog: (log: ReproductionLog) => void;
}

export function ReproductionTab({ animal, onAddLog, onUpdateLog }: ReproductionTabProps) {
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ReproductionLog | null>(null);

  const { control: addFormControl, register: addFormRegister, handleSubmit: handleAddSubmit, reset: resetAddForm, formState: { errors: addFormErrors } } = useForm<ReproductionLogFormData>({
    resolver: zodResolver(reproductionLogSchema),
    defaultValues: {
      date: formatToYYYYMMDD(new Date()),
      type: 'Inseminasi Buatan (IB)',
      notes: '',
      detail: '',
    }
  });

  const { control: editFormControl, register: editFormRegister, handleSubmit: handleEditSubmit, reset: resetEditForm, formState: { errors: editFormErrors } } = useForm<ReproductionLogFormData>({
    resolver: zodResolver(reproductionLogSchema),
  });

  useEffect(() => {
    if (editingLog) {
      resetEditForm({
        type: editingLog.type as any,
        detail: editingLog.detail,
        notes: editingLog.notes,
        date: formatToYYYYMMDD(editingLog.date),
      });
    }
  }, [editingLog, resetEditForm]);

  const onAddSubmit = (data: ReproductionLogFormData) => {
    const newLog = {
      ...data,
      date: new Date(data.date),
    };
    onAddLog(newLog);
    toast({
      title: 'Sukses',
      description: 'Catatan reproduksi berhasil disimpan.',
    });
    resetAddForm({
        date: formatToYYYYMMDD(new Date()),
        type: 'Inseminasi Buatan (IB)',
        notes: '',
        detail: '',
    });
  };

  const onEditSubmit = (data: ReproductionLogFormData) => {
    if (!editingLog) return;
    const updatedLog = {
      ...editingLog,
      ...data,
      date: new Date(data.date),
    };
    onUpdateLog(updatedLog);
    toast({
      title: 'Sukses',
      description: 'Catatan reproduksi berhasil diperbarui.',
    });
    setIsEditModalOpen(false);
    setEditingLog(null);
  };
  
  const openEditModal = (log: ReproductionLog) => {
    setEditingLog(log);
    setIsEditModalOpen(true);
  };
  
  const sortedLog = [...animal.reproductionLog].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan Reproduksi Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Jenis Peristiwa</label>
                <Controller
                  name="type"
                  control={addFormControl}
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
                <Input type="date" {...addFormRegister('date')} />
                {addFormErrors.date && <p className="text-destructive text-sm mt-1">{addFormErrors.date.message}</p>}
              </div>
            </div>
            <div>
              <label>Detail (ID Batch & Pejantan/Hasil PKB/Nama Anak dll)</label>
              <Input placeholder="Cth: Semen ID: IB-05-BCX" {...addFormRegister('detail')} />
              {addFormErrors.detail && <p className="text-destructive text-sm mt-1">{addFormErrors.detail.message}</p>}
            </div>
            <div>
              <label>Keterangan (Opsional)</label>
              <Textarea placeholder="Cth: Birahi malam, IB sukses dilakukan pagi hari." {...addFormRegister('notes')} />
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
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLog.length > 0 ? sortedLog.map((log, index) => (
                  <TableRow key={log.id || index}>
                    <TableCell>{log.date.toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>{log.detail}</TableCell>
                    <TableCell>{log.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(log)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada riwayat reproduksi.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Catatan Reproduksi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Jenis Peristiwa</label>
                <Controller
                  name="type"
                  control={editFormControl}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis" />
                      </SelectTrigger>
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
                  <Input
                    type="date"
                    {...editFormRegister('date')}
                  />
                  {editFormErrors.date && <p className="text-destructive text-sm mt-1">{editFormErrors.date.message}</p>}
                </div>
            </div>
             <div>
              <label>Detail (ID Batch & Pejantan/Hasil PKB/Nama Anak dll)</label>
              <Input placeholder="Cth: Semen ID: IB-05-BCX" {...editFormRegister('detail')} />
              {editFormErrors.detail && <p className="text-destructive text-sm mt-1">{editFormErrors.detail.message}</p>}
            </div>
             <div>
              <label>Keterangan (Opsional)</label>
              <Textarea placeholder="Cth: Birahi malam, IB sukses dilakukan pagi hari." {...editFormRegister('notes')} />
            </div>
             <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Batal</Button>
              </DialogClose>
              <Button type="submit">Simpan Perubahan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    
    
