'use client'

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { HealthLog, Livestock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Pencil } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatToYYYYMMDD } from '@/lib/utils';

const healthLogSchema = z.object({
  date: z.string().min(1, 'Tanggal harus diisi.'),
  type: z.enum(['Vaksinasi', 'Pengobatan', 'Lainnya']),
  detail: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
    if ((data.type === 'Vaksinasi' || data.type === 'Pengobatan') && (!data.detail || data.detail.trim() === '')) {
        return false;
    }
    return true;
}, {
    message: "Jenis Obat/Vaksin harus diisi untuk tipe Vaksinasi atau Pengobatan.",
    path: ['detail'],
});

type HealthLogFormData = z.infer<typeof healthLogSchema>;

interface HealthTabProps {
  animal: Livestock;
  onAddLog: (log: Omit<HealthLog, 'id'>) => void;
  onUpdateLog: (log: HealthLog) => void;
}

export function HealthTab({ animal, onAddLog, onUpdateLog }: HealthTabProps) {
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);

  const { control: addFormControl, register: addFormRegister, handleSubmit: handleAddSubmit, reset: resetAddForm, watch: watchAddForm, formState: { errors: addFormErrors } } = useForm<HealthLogFormData>({
    resolver: zodResolver(healthLogSchema),
    defaultValues: { type: 'Vaksinasi', notes: '', detail: '', date: formatToYYYYMMDD(new Date()) }
  });
  
  const { control: editFormControl, register: editFormRegister, handleSubmit: handleEditSubmit, reset: resetEditForm, watch: watchEditForm, formState: { errors: editFormErrors } } = useForm<HealthLogFormData>({
    resolver: zodResolver(healthLogSchema),
  });

  const selectedAddType = watchAddForm('type');
  const selectedEditType = watchEditForm('type');

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

  const onAddSubmit = (data: HealthLogFormData) => {
    const newLog = {
      ...data,
      date: new Date(data.date),
    };
    onAddLog(newLog);
    toast({
      title: 'Sukses',
      description: 'Catatan kesehatan berhasil disimpan.',
    });
    resetAddForm({ type: 'Vaksinasi', notes: '', detail: '', date: formatToYYYYMMDD(new Date()) });
  };
  
  const onEditSubmit = (data: HealthLogFormData) => {
    if (!editingLog) return;
    const updatedLog = {
      ...editingLog,
      ...data,
      date: new Date(data.date),
    };
    onUpdateLog(updatedLog);
    toast({
      title: 'Sukses',
      description: 'Catatan kesehatan berhasil diperbarui.',
    });
    setIsEditModalOpen(false);
    setEditingLog(null);
  };

  const openEditModal = (log: HealthLog) => {
    setEditingLog(log);
    setIsEditModalOpen(true);
  };

  const sortedLog = [...animal.healthLog].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-6">
      {/* Add New Log Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah Catatan Kesehatan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Jenis Catatan</label>
                <Controller
                  name="type"
                  control={addFormControl}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vaksinasi">Vaksinasi</SelectItem>
                        <SelectItem value="Pengobatan">Pengobatan</SelectItem>
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
            
            {(selectedAddType === 'Vaksinasi' || selectedAddType === 'Pengobatan') && (
              <div>
                <label>Jenis Obat/Vaksin</label>
                <Input placeholder="Cth : VetOxy La 5ml, Hematodin 3ml" {...addFormRegister('detail')} />
                {addFormErrors.detail && <p className="text-destructive text-sm mt-1">{addFormErrors.detail.message}</p>}
              </div>
            )}
            
            <div>
              <label>Keterangan</label>
              <Textarea placeholder="Cth : Avitaminosis/Cacingan dll" {...addFormRegister('notes')} />
            </div>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Simpan Catatan
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Health History Card */}
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
                  <TableHead>Perlakuan</TableHead>
                  <TableHead>Terapi</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLog.length > 0 ? sortedLog.map((log, index) => (
                  <TableRow key={log.id || index}>
                    <TableCell>{log.date.toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>{log.type}</TableCell>
                    <TableCell>{log.detail || '-'}</TableCell>
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
                      Belum ada riwayat kesehatan.
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
            <DialogTitle>Edit Catatan Kesehatan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 py-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label>Jenis Catatan</label>
                <Controller
                  name="type"
                  control={editFormControl}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vaksinasi">Vaksinasi</SelectItem>
                        <SelectItem value="Pengobatan">Pengobatan</SelectItem>
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
             {(selectedEditType === 'Vaksinasi' || selectedEditType === 'Pengobatan') && (
              <div>
                <label>Jenis Obat/Vaksin</label>
                <Input placeholder="Cth : VetOxy La 5ml, Hematodin 3ml" {...editFormRegister('detail')} />
                {editFormErrors.detail && <p className="text-destructive text-sm mt-1">{editFormErrors.detail.message}</p>}
              </div>
            )}
             <div>
              <label>Keterangan</label>
              <Textarea placeholder="Cth : Avitaminosis/Cacingan dll" {...editFormRegister('notes')} />
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
