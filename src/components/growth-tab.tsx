'use client'

import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GrowthRecord, Livestock } from '@/lib/types';
import { calculateADG, formatToYYYYMMDD } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const addRecordSchema = z.object({
  weight: z.number({ invalid_type_error: 'Bobot harus angka' }).positive('Bobot harus lebih dari 0'),
  date: z.string().min(1, 'Tanggal harus diisi.'),
});

type AddRecordFormData = z.infer<typeof addRecordSchema>;

const editRecordSchema = z.object({
    weight: z.number({ invalid_type_error: 'Bobot harus angka' }).positive('Bobot harus lebih dari 0'),
    date: z.string().min(1, 'Tanggal harus diisi.'),
});

type EditRecordFormData = z.infer<typeof editRecordSchema>;

interface GrowthTabProps {
  animal: Livestock;
  onAddRecord: (record: Omit<GrowthRecord, 'id' | 'adg'>) => void;
  onUpdateRecord: (record: GrowthRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  withPasswordProtection: (action: () => void) => void;
}

export function GrowthTab({ animal, onAddRecord, onUpdateRecord, onDeleteRecord, withPasswordProtection }: GrowthTabProps) {
  const { toast } = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<GrowthRecord | null>(null);

  const { register: addFormRegister, handleSubmit: handleAddSubmit, reset: resetAddForm, formState: { errors: addFormErrors } } = useForm<AddRecordFormData>({
    resolver: zodResolver(addRecordSchema),
    defaultValues: {
      date: formatToYYYYMMDD(new Date()),
    }
  });

  const { register: editFormRegister, handleSubmit: handleEditSubmit, reset: resetEditForm, formState: { errors: editFormErrors } } = useForm<EditRecordFormData>({
    resolver: zodResolver(editRecordSchema),
  });

  const { average: avgADG, records: growthRecordsWithADG } = useMemo(() => calculateADG(animal.growthRecords), [animal.growthRecords]);
  const latestWeight = growthRecordsWithADG.length > 0 ? growthRecordsWithADG[growthRecordsWithADG.length - 1].weight : 0;

  useEffect(() => {
    if (editingRecord) {
      resetEditForm({
        weight: editingRecord.weight,
        date: formatToYYYYMMDD(editingRecord.date),
      });
    }
  }, [editingRecord, resetEditForm]);


  const onAddSubmit = (data: AddRecordFormData) => {
    const saveAction = () => {
      if (latestWeight > 0 && data.weight <= latestWeight) {
          toast({
              variant: "destructive",
              title: "Input Bobot Tidak Valid",
              description: `Bobot baru harus lebih besar dari bobot terakhir (${latestWeight} kg).`,
          });
          return;
      }
      onAddRecord({ weight: data.weight, date: new Date(data.date) });
      toast({
        title: 'Sukses',
        description: `Bobot ${data.weight} kg berhasil disimpan.`,
      });
      resetAddForm({ date: formatToYYYYMMDD(new Date()), weight: undefined });
    };
    withPasswordProtection(saveAction);
  };

  const onEditSubmit = (data: EditRecordFormData) => {
    const saveAction = () => {
      if (!editingRecord) return;
      const updatedRecord: GrowthRecord = {
          ...editingRecord,
          ...data,
          date: new Date(data.date)
      };
      onUpdateRecord(updatedRecord);
      toast({
          title: 'Sukses',
          description: 'Catatan pertumbuhan berhasil diperbarui.',
      });
      setIsEditModalOpen(false);
      setEditingRecord(null);
    };
    withPasswordProtection(saveAction);
  };

  const handleDelete = (recordId: string) => {
    const deleteAction = () => {
        onDeleteRecord(recordId);
    };
    withPasswordProtection(deleteAction);
  };

  const openEditModal = (record: GrowthRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };
  
  const triggerEditSubmit = () => {
      handleEditSubmit(onEditSubmit)();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Catat Bobot Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSubmit(onAddSubmit)} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label>Tanggal Timbang</label>
              <Input type="date" {...addFormRegister('date')} />
              {addFormErrors.date && <p className="text-destructive text-sm mt-1">{addFormErrors.date.message}</p>}
            </div>
            <div className="flex-grow">
              <label>Bobot (kg)</label>
              <Input type="number" placeholder="Bobot (kg)" {...addFormRegister('weight', { valueAsNumber: true })} />
              {addFormErrors.weight && <p className="text-destructive text-sm mt-1">{addFormErrors.weight.message}</p>}
            </div>
            <Button type="submit" className="w-full sm:w-auto self-end">
              <Save className="mr-2 h-4 w-4" />
              Simpan Bobot
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-purple-50 border-purple-300">
        <CardHeader>
            <CardTitle className="text-purple-700">ADG (Average Daily Gain)</CardTitle>
            <CardDescription>Bobot terakhir: <strong>{latestWeight > 0 ? `${latestWeight} kg` : 'N/A'}</strong></CardDescription>
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
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {growthRecordsWithADG.length > 0 ? [...growthRecordsWithADG].reverse().map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                    <TableCell className="font-medium">{record.weight}</TableCell>
                    <TableCell>{record.adg}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(record)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat diurungkan. Ini akan menghapus catatan pertumbuhan secara permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(record.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                       </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada data pertumbuhan.
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
            <DialogTitle>Edit Catatan Pertumbuhan</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {e.preventDefault(); triggerEditSubmit(); }} className="space-y-4 py-4">
             <div>
                <label>Tanggal Timbang</label>
                <Input type="date" {...editFormRegister('date')} />
                {editFormErrors.date && <p className="text-destructive text-sm mt-1">{editFormErrors.date.message}</p>}
            </div>
            <div>
                <label>Bobot (kg)</label>
                <Input type="number" placeholder="Bobot (kg)" {...editFormRegister('weight', { valueAsNumber: true })} />
                {editFormErrors.weight && <p className="text-destructive text-sm mt-1">{editFormErrors.weight.message}</p>}
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
