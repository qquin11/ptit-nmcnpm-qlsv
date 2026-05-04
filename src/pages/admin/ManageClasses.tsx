import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ManageClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ class_name: '', major: '', homeroom_teacher_id: '' });
  const { toast } = useToast();

  const fetchData = async () => {
    const [cl, te] = await Promise.all([
      supabase.from('classes').select('*, teachers:homeroom_teacher_id(full_name)').order('created_at', { ascending: false }),
      supabase.from('teachers').select('id, full_name'),
    ]);
    if (cl.data) setClasses(cl.data);
    if (te.data) setTeachers(te.data);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ class_name: '', major: '', homeroom_teacher_id: '' }); setEditing(null); };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({ class_name: c.class_name, major: c.major || '', homeroom_teacher_id: c.homeroom_teacher_id || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.class_name.trim()) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên lớp là bắt buộc' });
      return;
    }
    const payload = {
      class_name: form.class_name.trim(),
      major: form.major.trim() || null,
      homeroom_teacher_id: form.homeroom_teacher_id || null,
    };

    if (editing) {
      const { error } = await supabase.from('classes').update(payload).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Cập nhật lớp thành công' });
    } else {
      const { error } = await supabase.from('classes').insert(payload);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Thêm lớp thành công' });
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa lớp này?')) return;
    await supabase.from('classes').delete().eq('id', id);
    toast({ title: 'Đã xóa lớp' });
    fetchData();
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Lớp</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Lớp</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa Lớp' : 'Thêm Lớp'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tên Lớp</Label><Input placeholder="VD: D20CN01" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} /></div>
              <div><Label>Chuyên ngành</Label><Input value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} /></div>
              <div>
                <Label>Giáo viên chủ nhiệm</Label>
                <Select value={form.homeroom_teacher_id} onValueChange={v => setForm({ ...form, homeroom_teacher_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn giáo viên chủ nhiệm" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Lớp</TableHead>
              <TableHead>Chuyên ngành</TableHead>
              <TableHead>GVCN</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.class_name}</TableCell>
                <TableCell>{c.major || '—'}</TableCell>
                <TableCell>{(c.teachers as any)?.full_name || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {classes.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Không có lớp nào</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageClasses;
