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
import { Plus, Pencil, Search, BookOpen } from 'lucide-react';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

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
  email?: string | null;
  gender: string | null;
  address: string | null;
  status: string | null;
}

const ManageStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({ student_code: '', full_name: '', dob: '', department: '', phone: '', class_id: '', email: '', password: '', gender: '', address: '', status: 'active' });
  const [coursesDialogStudent, setCoursesDialogStudent] = useState<Student | null>(null);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const { toast } = useToast();

  const fetchStudents = async () => {
    const [st, cl] = await Promise.all([
      supabase.from('students').select('*, classes(class_name)').order('created_at', { ascending: false }),
      supabase.from('classes').select('id, class_name'),
    ]);
    if (st.data) {
      const userIds = (st.data as any[]).map(s => s.user_id).filter(Boolean);
      let emailMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, email').in('user_id', userIds);
        if (profs) emailMap = Object.fromEntries(profs.map((p: any) => [p.user_id, p.email]));
      }
      setStudents((st.data as any[]).map(s => ({ ...s, email: emailMap[s.user_id] ?? null })) as any);
    }
    if (cl.data) setClasses(cl.data);
  };

  useEffect(() => { fetchStudents(); }, []);

  const resetForm = () => {
    setForm({ student_code: '', full_name: '', dob: '', department: '', phone: '', class_id: '', email: '', password: '', gender: '', address: '', status: 'active' });
    setEditing(null);
  };

  const handleEdit = (s: Student) => {
    setEditing(s);
    setForm({ student_code: s.student_code, full_name: s.full_name, dob: s.dob || '', department: s.department || '', phone: s.phone || '', class_id: s.class_id || '', email: '', password: '', gender: s.gender || '', address: s.address || '', status: s.status || 'active' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.student_code.trim() || !form.full_name.trim() || !form.dob || !form.gender || !form.department.trim() || !form.class_id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng điền đầy đủ các trường bắt buộc' });
      return;
    }

    const code = form.student_code.trim();
    const dupCode = await supabase.from('students').select('id').eq('student_code', code).maybeSingle();
    if (dupCode.data && dupCode.data.id !== editing?.id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã sinh viên đã tồn tại' });
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
        gender: form.gender || null,
        address: form.address.trim() || null,
        status: form.status || 'active',
      }).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Cập nhật sinh viên thành công' });
    } else {
      if (!form.email.trim() || !form.password.trim()) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Email và mật khẩu là bắt buộc' });
        return;
      }
      const email = form.email.trim();
      const dupEmail = await supabase.from('profiles').select('user_id').eq('email', email).maybeSingle();
      if (dupEmail.data) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Email đã được sử dụng' });
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
          gender: form.gender || null,
          address: form.address.trim() || null,
          status: form.status || 'active',
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

  const statusLabel = (status: string | null) => {
    switch (status) {
      case 'active': return 'Đang học';
      case 'interrupted': return 'Bảo lưu';
      case 'terminated': return 'Thôi học';
      case 'graduated': return 'Đã tốt nghiệp';
      default: return '—';
    }
  };

  const handleViewCourses = async (s: Student) => {
    setCoursesDialogStudent(s);
    setStudentCourses([]);
    const { data } = await supabase
      .from('grades')
      .select('id, average, courses(course_code, course_name, credits), semesters(name, start_date)')
      .eq('student_id', s.id);
    if (data) {
      const sorted = [...data].sort((a: any, b: any) => {
        const da = a.semesters?.start_date || '';
        const db = b.semesters?.start_date || '';
        return da < db ? 1 : -1;
      });
      setStudentCourses(sorted);
    }
  };

  const handleDelete = async (id: string) => {
    const { count } = await supabase.from('grades').select('id', { count: 'exact', head: true }).eq('student_id', id);
    if ((count ?? 0) > 0) {
      toast({ variant: 'destructive', title: 'Không thể xóa', description: `Sinh viên này đã có ${count} bản ghi điểm. Vui lòng xóa các bản ghi liên quan trước.` });
      return;
    }
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
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Sửa Sinh viên' : 'Thêm Sinh viên'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {!editing && (
                <>
                  <div><Label required>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label required>Mật khẩu</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                </>
              )}
              <div><Label required>Mã Sinh viên</Label><Input value={form.student_code} onChange={e => setForm({ ...form, student_code: e.target.value })} /></div>
              <div><Label required>Họ tên</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label required>Ngày sinh</Label><Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></div>
              <div>
                <Label required>Giới tính</Label>
                <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Nam</SelectItem>
                    <SelectItem value="F">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label required>Chuyên Ngành</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div>
                <Label required>Lớp</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Điện thoại</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Địa chỉ</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div>
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang học</SelectItem>
                    <SelectItem value="interrupted">Bảo lưu</SelectItem>
                    <SelectItem value="terminated">Thôi học</SelectItem>
                    <SelectItem value="graduated">Đã tốt nghiệp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <TableHead>Chuyên Ngành</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Trạng thái</TableHead>
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
                <TableCell>{s.email || '—'}</TableCell>
                <TableCell>{s.phone || '—'}</TableCell>
                <TableCell>{statusLabel(s.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleViewCourses(s)} title="Xem môn học"><BookOpen size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}><Pencil size={14} /></Button>
                    <ConfirmDeleteButton onConfirm={() => handleDelete(s.id)} description={`Bạn có chắc muốn xóa sinh viên "${s.full_name}" (${s.student_code})? Hành động này không thể hoàn tác.`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Không tìm thấy sinh viên</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!coursesDialogStudent} onOpenChange={(o) => { if (!o) { setCoursesDialogStudent(null); setStudentCourses([]); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Môn học của {coursesDialogStudent?.full_name}
              {coursesDialogStudent?.student_code ? ` (${coursesDialogStudent.student_code})` : ''}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã MH</TableHead>
                <TableHead>Tên Môn học</TableHead>
                <TableHead>Số Tín chỉ</TableHead>
                <TableHead>Học kỳ</TableHead>
                <TableHead>Điểm trung bình</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentCourses.map((g: any) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-sm">{g.courses?.course_code}</TableCell>
                  <TableCell className="font-medium">{g.courses?.course_name}</TableCell>
                  <TableCell>{g.courses?.credits ?? '—'}</TableCell>
                  <TableCell>{g.semesters?.name ?? '—'}</TableCell>
                  <TableCell className="font-bold">{g.average === null || g.average === undefined ? '—' : Number(g.average).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {studentCourses.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sinh viên chưa đăng ký môn học nào</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageStudents;
