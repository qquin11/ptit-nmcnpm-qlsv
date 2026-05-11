import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Search } from 'lucide-react';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

const ManageSemesters = () => {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '' });
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase.from('semesters').select('*').order('start_date', { ascending: false });
    if (data) setSemesters(data);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ name: '', start_date: '', end_date: '' }); setEditing(null); };

  const handleEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name, start_date: s.start_date, end_date: s.end_date });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      toast({ variant: 'destructive', title: 'Vui lòng điền đầy đủ thông tin' });
      return;
    }
    const payload = { name: form.name.trim(), start_date: form.start_date, end_date: form.end_date };
    if (editing) {
      await supabase.from('semesters').update(payload).eq('id', editing.id);
      toast({ title: 'Cập nhật học kỳ thành công' });
    } else {
      await supabase.from('semesters').insert(payload);
      toast({ title: 'Thêm học kỳ thành công' });
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { data: gradeRows } = await supabase.from('grades').select('course_id').eq('semester_id', id);
    const courseCount = new Set((gradeRows || []).map((g: any) => g.course_id)).size;
    if (courseCount > 0) {
      toast({ variant: 'destructive', title: 'Không thể xóa', description: `Học kỳ này đã có ${courseCount} môn học. Vui lòng xóa các bản ghi liên quan trước.` });
      return;
    }
    await supabase.from('semesters').delete().eq('id', id);
    toast({ title: 'Đã xóa học kỳ' });
    fetchData();
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Học kỳ</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Học kỳ</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa' : 'Thêm'} Học kỳ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label required>Tên Học kỳ</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="HK1 2025-2026" /></div>
              <div><Label required>Ngày bắt đầu</Label><Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label required>Ngày kết thúc</Label><Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Tìm học kỳ..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên Học kỳ</TableHead>
              <TableHead>Ngày bắt đầu</TableHead>
              <TableHead>Ngày kết thúc</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {semesters.filter(s =>
              s.name.toLowerCase().includes(search.toLowerCase())
            ).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.start_date}</TableCell>
                <TableCell>{s.end_date}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil size={14} /></Button>
                    <ConfirmDeleteButton onConfirm={() => handleDelete(s.id)} description={`Bạn có chắc muốn xóa học kỳ "${s.name}"? Hành động này không thể hoàn tác.`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {semesters.filter(s =>
              s.name.toLowerCase().includes(search.toLowerCase())
            ).length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Không tìm thấy học kỳ</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageSemesters;
