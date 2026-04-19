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
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ class_name: '', course_id: '', teacher_id: '', semester_id: '', max_students: '30' });
  const { toast } = useToast();

  const fetchData = async () => {
    const [cl, co, te, se] = await Promise.all([
      supabase.from('classes').select('*, courses(course_name), teachers(full_name), semesters(name)').order('created_at', { ascending: false }),
      supabase.from('courses').select('id, course_name'),
      supabase.from('teachers').select('id, full_name'),
      supabase.from('semesters').select('id, name'),
    ]);
    if (cl.data) setClasses(cl.data);
    if (co.data) setCourses(co.data);
    if (te.data) setTeachers(te.data);
    if (se.data) setSemesters(se.data);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ class_name: '', course_id: '', teacher_id: '', semester_id: '', max_students: '30' }); setEditing(null); };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({ class_name: c.class_name, course_id: c.course_id, teacher_id: c.teacher_id || '', semester_id: c.semester_id, max_students: String(c.max_students) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.class_name.trim() || !form.course_id || !form.semester_id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên lớp, môn học và học kỳ là bắt buộc' });
      return;
    }
    const payload = {
      class_name: form.class_name.trim(),
      course_id: form.course_id,
      teacher_id: form.teacher_id || null,
      semester_id: form.semester_id,
      max_students: parseInt(form.max_students) || 30,
    };

    if (editing) {
      const { error } = await supabase.from('classes').update(payload).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Cập nhật lớp học thành công' });
    } else {
      const { error } = await supabase.from('classes').insert(payload);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Thêm lớp học thành công' });
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa lớp học này?')) return;
    await supabase.from('classes').delete().eq('id', id);
    toast({ title: 'Đã xóa lớp học' });
    fetchData();
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Lớp học</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Lớp học</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa Lớp học' : 'Thêm Lớp học'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Tên Lớp</Label><Input value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} /></div>
              <div>
                <Label>Môn học</Label>
                <Select value={form.course_id} onValueChange={v => setForm({ ...form, course_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn môn học" /></SelectTrigger>
                  <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Giảng viên</Label>
                <Select value={form.teacher_id} onValueChange={v => setForm({ ...form, teacher_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Học kỳ</Label>
                <Select value={form.semester_id} onValueChange={v => setForm({ ...form, semester_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
                  <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Sĩ số tối đa</Label><Input type="number" value={form.max_students} onChange={e => setForm({ ...form, max_students: e.target.value })} /></div>
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
              <TableHead>Môn học</TableHead>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Học kỳ</TableHead>
              <TableHead>Sĩ số</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.class_name}</TableCell>
                <TableCell>{(c.courses as any)?.course_name || '—'}</TableCell>
                <TableCell>{(c.teachers as any)?.full_name || '—'}</TableCell>
                <TableCell>{(c.semesters as any)?.name || '—'}</TableCell>
                <TableCell>{c.max_students}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {classes.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không có lớp học nào</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageClasses;
