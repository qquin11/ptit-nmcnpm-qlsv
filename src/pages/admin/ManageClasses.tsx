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
import { Plus, Pencil, Search, Users } from 'lucide-react';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

const ManageClasses = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterMajor, setFilterMajor] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [form, setForm] = useState({ class_name: '', major: '', homeroom_teacher_id: '' });
  const [viewStudentsClass, setViewStudentsClass] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
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
    if (!form.class_name.trim() || !form.major.trim() || !form.homeroom_teacher_id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ các trường bắt buộc' });
      return;
    }
    const name = form.class_name.trim();
    const dup = await supabase.from('classes').select('id').eq('class_name', name).maybeSingle();
    if (dup.data && dup.data.id !== editing?.id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên lớp đã tồn tại' });
      return;
    }
    const payload = {
      class_name: name,
      major: form.major.trim(),
      homeroom_teacher_id: form.homeroom_teacher_id,
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

  const openViewStudents = async (c: any) => {
    setViewStudentsClass(c);
    setClassStudents([]);
    setStudentSearch('');
    const { data } = await supabase
      .from('students')
      .select('id, student_code, full_name, department')
      .eq('class_id', c.id)
      .order('full_name');
    if (data) setClassStudents(data);
  };

  const handleDelete = async (id: string) => {
    const { count } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('class_id', id);
    if ((count ?? 0) > 0) {
      toast({ variant: 'destructive', title: 'Không thể xóa', description: `Lớp này đang có ${count} sinh viên. Vui lòng chuyển sinh viên sang lớp khác trước.` });
      return;
    }
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
              <div><Label required>Tên Lớp</Label><Input placeholder="VD: D20CN01" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })} /></div>
              <div><Label required>Chuyên ngành</Label><Input value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} /></div>
              <div>
                <Label required>Giáo viên chủ nhiệm</Label>
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

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm lớp..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterMajor} onValueChange={setFilterMajor}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Chuyên ngành" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyên ngành</SelectItem>
            {Array.from(new Set(classes.map((c: any) => c.major).filter(Boolean))).map((m: any) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead>Tên Lớp</TableHead>
              <TableHead>Chuyên ngành</TableHead>
              <TableHead>GVCN</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.filter(c =>
              (c.class_name.toLowerCase().includes(search.toLowerCase()) ||
                (c.major || '').toLowerCase().includes(search.toLowerCase())) &&
              (filterMajor === 'all' || c.major === filterMajor)
            ).map((c, i) => (
              <TableRow key={c.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><button onClick={() => setViewing(c)} className="font-medium text-primary hover:underline">{c.class_name}</button></TableCell>
                <TableCell>{c.major || '—'}</TableCell>
                <TableCell>{(c.teachers as any)?.full_name || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openViewStudents(c)} title="Xem danh sách sinh viên"><Users size={14} /></Button>
                    <ConfirmDeleteButton onConfirm={() => handleDelete(c.id)} description={`Bạn có chắc muốn xóa lớp "${c.class_name}"? Hành động này không thể hoàn tác.`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {classes.filter(c =>
              (c.class_name.toLowerCase().includes(search.toLowerCase()) ||
                (c.major || '').toLowerCase().includes(search.toLowerCase())) &&
              (filterMajor === 'all' || c.major === filterMajor)
            ).length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Không tìm thấy lớp</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!viewStudentsClass} onOpenChange={(o) => { if (!o) { setViewStudentsClass(null); setClassStudents([]); setStudentSearch(''); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Danh sách sinh viên lớp {viewStudentsClass?.class_name}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm sinh viên..." className="pl-9" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>Mã SV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Chuyên ngành</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStudents
                  .filter((s) =>
                    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{s.student_code}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.department || '—'}</TableCell>
                    </TableRow>
                  ))}
                {classStudents.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Lớp chưa có sinh viên</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="pt-2 text-sm text-muted-foreground">Tổng số: {classStudents.length} sinh viên</div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết lớp</DialogTitle></DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Tên lớp</dt><dd className="col-span-2 font-medium">{viewing.class_name}</dd>
              <dt className="text-muted-foreground">Chuyên ngành</dt><dd className="col-span-2">{viewing.major || '—'}</dd>
              <dt className="text-muted-foreground">GVCN</dt><dd className="col-span-2">{viewing.teachers?.full_name || '—'}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageClasses;
