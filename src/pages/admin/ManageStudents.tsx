import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const studentFormSchema = z.object({
  email: z.string().default(''),
  password: z.string().default(''),
  student_code: z.string().min(1, 'Mã sinh viên không được trống').regex(/^[a-zA-Z0-9]+$/, 'Mã sinh viên chỉ chứa chữ và số'),
  full_name: z.string().min(1, 'Họ tên không được trống').regex(/^[\p{L}\s]+$/u, 'Họ tên chỉ chứa chữ cái'),
  dob: z.string().min(1, 'Ngày sinh không được trống').regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không hợp lệ'),
  gender: z.string().min(1, 'Vui lòng chọn giới tính').refine(val => ['M', 'F'].includes(val), 'Giới tính không hợp lệ'),
  department: z.string().min(1, 'Chuyên ngành không được trống'),
  class_id: z.string().min(1, 'Vui lòng chọn lớp'),
  phone: z.string().refine(val => val === '' || /^\d{10}$/.test(val), { message: 'SĐT phải gồm đúng 10 chữ số' }),
  address: z.string().default(''),
  status: z.string().default('active'),
  _isEditing: z.boolean(),
}).superRefine((data, ctx) => {
  if (!data._isEditing) {
    if (!data.email.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email không được trống' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Email không hợp lệ' });
    }
    if (!data.password.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Mật khẩu không được trống' });
    } else {
      if (data.password.trim().length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Mật khẩu phải có ít nhất 8 ký tự' });
      }
      if (data.password.trim().length > 32) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Mật khẩu tối đa 32 ký tự' });
      }
      if (!/^[a-zA-Z0-9]+$/.test(data.password.trim())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: 'Mật khẩu chỉ chứa chữ và số' });
      }
    }
  }
});

type StudentFormData = z.infer<typeof studentFormSchema>;

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

const defaultFormValues: StudentFormData = {
  email: '', password: '', student_code: '', full_name: '', dob: '',
  gender: '', department: '', class_id: '', phone: '', address: '', status: 'active',
  _isEditing: false,
};

const ManageStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [coursesDialogStudent, setCoursesDialogStudent] = useState<Student | null>(null);
  const [viewing, setViewing] = useState<Student | null>(null);
  const [studentCourses, setStudentCourses] = useState<any[]>([]);
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaultFormValues,
  });

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
    reset(defaultFormValues);
    setEditing(null);
  };

  const handleEdit = (s: Student) => {
    setEditing(s);
    reset({
      student_code: s.student_code,
      full_name: s.full_name,
      dob: s.dob || '',
      department: s.department || '',
      phone: s.phone || '',
      class_id: s.class_id || '',
      email: '',
      password: '',
      gender: s.gender || '',
      address: s.address || '',
      status: s.status || 'active',
      _isEditing: true,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: StudentFormData) => {
    const code = data.student_code.trim();
    const dupCode = await supabase.from('students').select('id').eq('student_code', code).maybeSingle();
    if (dupCode.data && dupCode.data.id !== editing?.id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã sinh viên đã tồn tại' });
      return;
    }

    if (editing) {
      const { error } = await supabase.from('students').update({
        student_code: data.student_code.trim(),
        full_name: data.full_name.trim(),
        dob: data.dob || null,
        department: data.department.trim() || null,
        phone: data.phone.trim() || null,
        class_id: data.class_id || null,
        gender: data.gender || null,
        address: data.address.trim() || null,
        status: data.status || 'active',
      }).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Cập nhật sinh viên thành công' });
    } else {
      const email = data.email.trim();
      const dupEmail = await supabase.from('profiles').select('user_id').eq('email', email).maybeSingle();
      if (dupEmail.data) {
        toast({ variant: 'destructive', title: 'Lỗi', description: 'Email đã được sử dụng' });
        return;
      }
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
      );
      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: data.email.trim(),
        password: data.password.trim(),
      });
      if (authError || !authData.user) {
        toast({ variant: 'destructive', title: 'Lỗi tạo tài khoản', description: authError?.message || 'Không tạo được tài khoản' });
        return;
      }
      const userId = authData.user.id;
      const [studentRes, roleRes] = await Promise.all([
        supabase.from('students').insert({
          user_id: userId,
          student_code: data.student_code.trim(),
          full_name: data.full_name.trim(),
          dob: data.dob || null,
          department: data.department.trim() || null,
          phone: data.phone.trim() || null,
          class_id: data.class_id || null,
          gender: data.gender || null,
          address: data.address.trim() || null,
          status: data.status || 'active',
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

  const departmentOptions = Array.from(new Set(students.map(s => s.department).filter(Boolean))) as string[];

  const filtered = students.filter(s =>
    (s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_code.toLowerCase().includes(search.toLowerCase())) &&
    (filterClassId === 'all' || s.class_id === filterClassId) &&
    (filterDepartment === 'all' || s.department === filterDepartment)
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
                  <div>
                    <Label required>Email</Label>
                    <Input {...register('email')} />
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <Label required>Mật khẩu</Label>
                    <Input type="password" {...register('password')} />
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
                  </div>
                </>
              )}
              <div>
                <Label required>Mã Sinh viên</Label>
                <Input {...register('student_code')} />
                {errors.student_code && <p className="text-sm text-red-500 mt-1">{errors.student_code.message}</p>}
              </div>
              <div>
                <Label required>Họ tên</Label>
                <Input {...register('full_name')} />
                {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label required>Ngày sinh</Label>
                <Input type="date" {...register('dob')} />
                {errors.dob && <p className="text-sm text-red-500 mt-1">{errors.dob.message}</p>}
              </div>
              <div>
                <Label required>Giới tính</Label>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Nam</SelectItem>
                        <SelectItem value="F">Nữ</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>}
              </div>
              <div>
                <Label required>Chuyên Ngành</Label>
                <Input {...register('department')} />
                {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>}
              </div>
              <div>
                <Label required>Lớp</Label>
                <Controller
                  control={control}
                  name="class_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.class_id && <p className="text-sm text-red-500 mt-1">{errors.class_id.message}</p>}
              </div>
              <div>
                <Label>Điện thoại</Label>
                <Input {...register('phone')} />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <Label>Địa chỉ</Label>
                <Input {...register('address')} />
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Đang học</SelectItem>
                        <SelectItem value="interrupted">Bảo lưu</SelectItem>
                        <SelectItem value="terminated">Thôi học</SelectItem>
                        <SelectItem value="graduated">Đã tốt nghiệp</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <Button onClick={handleSubmit(onSubmit)} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm sinh viên..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterClassId} onValueChange={setFilterClassId}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Lớp" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả lớp</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Chuyên Ngành" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chuyên ngành</SelectItem>
            {departmentOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
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
            {filtered.map((s, i) => (
              <TableRow key={s.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><button onClick={() => setViewing(s)} className="font-mono text-sm text-primary hover:underline">{s.student_code}</button></TableCell>
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
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Không tìm thấy sinh viên</TableCell></TableRow>
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

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết sinh viên</DialogTitle></DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Mã SV</dt><dd className="col-span-2 font-mono">{viewing.student_code}</dd>
              <dt className="text-muted-foreground">Họ tên</dt><dd className="col-span-2 font-medium">{viewing.full_name}</dd>
              <dt className="text-muted-foreground">Ngày sinh</dt><dd className="col-span-2">{viewing.dob || '—'}</dd>
              <dt className="text-muted-foreground">Giới tính</dt><dd className="col-span-2">{viewing.gender === 'M' ? 'Nam' : viewing.gender === 'F' ? 'Nữ' : '—'}</dd>
              <dt className="text-muted-foreground">Chuyên ngành</dt><dd className="col-span-2">{viewing.department || '—'}</dd>
              <dt className="text-muted-foreground">Lớp</dt><dd className="col-span-2">{viewing.classes?.class_name || '—'}</dd>
              <dt className="text-muted-foreground">Email</dt><dd className="col-span-2">{viewing.email || '—'}</dd>
              <dt className="text-muted-foreground">Điện thoại</dt><dd className="col-span-2">{viewing.phone || '—'}</dd>
              <dt className="text-muted-foreground">Địa chỉ</dt><dd className="col-span-2">{viewing.address || '—'}</dd>
              <dt className="text-muted-foreground">Trạng thái</dt><dd className="col-span-2">{statusLabel(viewing.status)}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageStudents;
