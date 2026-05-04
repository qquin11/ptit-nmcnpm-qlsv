import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Student {
  id: string;
  student_code: string;
  full_name: string;
  dob: string | null;
  department: string | null;
  phone: string | null;
  class_id: string | null;
  classes?: { class_name: string } | null;
  user_id: string;
}

const ManageStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ student_code: '', full_name: '', dob: '', department: '', phone: '', class_id: '', email: '', password: '' });
  const { toast } = useToast();

  const fetchStudents = async () => {
    const [st, cl] = await Promise.all([
      supabase.from('students').select('*, classes(class_name)').order('created_at', { ascending: false }),
      supabase.from('classes').select('id, class_name'),
    ]);
    if (st.data) setStudents(st.data as any);
    if (cl.data) setClasses(cl.data);
  };

  useEffect(() => { fetchStudents(); }, []);

  const resetForm = () => {
    setForm({ student_code: '', full_name: '', dob: '', department: '', phone: '', class_id: '', email: '', password: '' });
    setEditing(null);
  };

  const handleEdit = (s: Student) => {
    setEditing(s);
    setForm({ student_code: s.student_code, full_name: s.full_name, dob: s.dob || '', department: s.department || '', phone: s.phone || '', class_id: s.class_id || '', email: '', password: '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.student_code.trim() || !form.full_name.trim()) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã sinh viên và họ tên là bắt buộc' });
      return;
    }

    if (editing) {
      const { error } = await supabase.from('students').update({
        student_code: form.student_code.trim(),
        full_name: form.full_name.trim(),
        dob: form.dob || null,
        department: form.department.trim() || null,
        phone: form.phone.trim() || null,
        class_id: form.class_id || null,
      }).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Cập nhật sinh viên thành công' });
    } else {
      if (!form.email.trim() || !form.password.trim()) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Email và mật khẩu là bắt buộc' });
        return;
      }
      // Use a temporary client (no session persistence) so admin stays logged in
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: form.email.trim(),
        password: form.password.trim(),
      });
      if (authError || !authData.user) {
        toast({ variant: 'destructive', title: 'Lỗi tạo tài khoản', description: authError?.message || 'Không tạo được tài khoản' });
        return;
      }
      const userId = authData.user.id;
      const [studentRes, roleRes] = await Promise.all([
        supabase.from('students').insert({
          user_id: userId,
          student_code: form.student_code.trim(),
          full_name: form.full_name.trim(),
          dob: form.dob || null,
          department: form.department.trim() || null,
          phone: form.phone.trim() || null,
          class_id: form.class_id || null,
        }),
        supabase.from('user_roles').insert({ user_id: userId, role: 'student' }),
      ]);
      if (studentRes.error || roleRes.error) {
        toast({ variant: 'destructive', title: 'Lỗi', description: studentRes.error?.message || roleRes.error?.message });
        return;
      }
      toast({ title: 'Thêm sinh viên thành công' });
    }

    setDialogOpen(false);
    resetForm();
    fetchStudents();
  };

  const className = (s: Student) => s.classes?.class_name || '—';

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa sinh viên này?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
    toast({ title: 'Đã xóa sinh viên' });
    fetchStudents();
  };

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Sinh viên</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus size={16} className="mr-2" />Thêm Sinh viên</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Sửa Sinh viên' : 'Thêm Sinh viên'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {!editing && (
                <>
                  <div><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Mật khẩu</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                </>
              )}
              <div><Label>Mã Sinh viên</Label><Input value={form.student_code} onChange={e => setForm({ ...form, student_code: e.target.value })} /></div>
              <div><Label>Họ tên</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Ngày sinh</Label><Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
              <div><Label>Khoa</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div>
                <Label>Lớp</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Điện thoại</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Tìm sinh viên..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã SV</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Khoa</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">{s.student_code}</TableCell>
                <TableCell className="font-medium">{s.full_name}</TableCell>
                <TableCell>{className(s)}</TableCell>
                <TableCell>{s.department || '—'}</TableCell>
                <TableCell>{s.phone || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Không tìm thấy sinh viên</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageStudents;
