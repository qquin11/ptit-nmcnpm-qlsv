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
import { Plus, Pencil, Search } from 'lucide-react';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

const ManageCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ course_code: '', course_name: '', credits: '3', department: '', teacher_id: '' });
  const { toast } = useToast();

  const fetchData = async () => {
    const [co, te] = await Promise.all([
      supabase.from('courses').select('*, teachers(full_name)').order('created_at', { ascending: false }),
      supabase.from('teachers').select('id, full_name'),
    ]);
    if (co.data) setCourses(co.data);
    if (te.data) setTeachers(te.data);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ course_code: '', course_name: '', credits: '3', department: '', teacher_id: '' }); setEditing(null); };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({ course_code: c.course_code, course_name: c.course_name, credits: String(c.credits), department: c.department || '', teacher_id: c.teacher_id || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.course_code.trim() || !form.course_name.trim() || !form.credits.trim() || !form.department.trim() || !form.teacher_id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ các trường bắt buộc' });
      return;
    }
    const code = form.course_code.trim();
    const dup = await supabase.from('courses').select('id').eq('course_code', code).maybeSingle();
    if (dup.data && dup.data.id !== editing?.id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã môn học đã tồn tại' });
      return;
    }
    const payload = {
      course_code: code,
      course_name: form.course_name.trim(),
      credits: parseInt(form.credits) || 3,
      department: form.department.trim(),
      teacher_id: form.teacher_id,
    };

    if (editing) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Cập nhật môn học thành công' });
    } else {
      const { error } = await supabase.from('courses').insert(payload);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Thêm môn học thành công' });
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { data: gradeRows } = await supabase.from('grades').select('student_id').eq('course_id', id);
    const studentCount = new Set((gradeRows || []).map((g: any) => g.student_id)).size;
    if (studentCount > 0) {
      toast({ variant: 'destructive', title: 'Không thể xóa', description: `Môn học này đã có ${studentCount} sinh viên theo học. Vui lòng xóa các bản ghi liên quan trước.` });
      return;
    }
    await supabase.from('courses').delete().eq('id', id);
    toast({ title: 'Đã xóa môn học' });
    fetchData();
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Môn học</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Môn học</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa Môn học' : 'Thêm Môn học'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label required>Mã Môn học</Label><Input value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} /></div>
              <div><Label required>Tên Môn học</Label><Input value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} /></div>
              <div><Label required>Số tín chỉ</Label><Input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} /></div>
              <div><Label required>Khoa</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div>
                <Label required>Giảng viên</Label>
                <Select value={form.teacher_id} onValueChange={v => setForm({ ...form, teacher_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Tìm môn học..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã MH</TableHead>
              <TableHead>Tên Môn học</TableHead>
              <TableHead>Tín chỉ</TableHead>
              <TableHead>Khoa</TableHead>
              <TableHead>Giảng viên</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.filter(c =>
              c.course_name.toLowerCase().includes(search.toLowerCase()) ||
              c.course_code.toLowerCase().includes(search.toLowerCase())
            ).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.course_code}</TableCell>
                <TableCell className="font-medium">{c.course_name}</TableCell>
                <TableCell>{c.credits}</TableCell>
                <TableCell>{c.department || '—'}</TableCell>
                <TableCell>{(c.teachers as any)?.full_name || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
                    <ConfirmDeleteButton onConfirm={() => handleDelete(c.id)} description={`Bạn có chắc muốn xóa môn học "${c.course_name}"? Hành động này không thể hoàn tác.`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {courses.filter(c =>
              c.course_name.toLowerCase().includes(search.toLowerCase()) ||
              c.course_code.toLowerCase().includes(search.toLowerCase())
            ).length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không tìm thấy môn học</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageCourses;
