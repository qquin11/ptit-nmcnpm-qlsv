import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { useForm } from 'react-hook-form';
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
import { Plus, Pencil, Search } from 'lucide-react';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

const teacherFormSchema = z.object({
  email: z.string().default(''),
  password: z.string().default(''),
  teacher_code: z.string().min(1, 'Mã giảng viên không được trống').regex(/^[a-zA-Z0-9]+$/, 'Mã giảng viên chỉ chứa chữ và số'),
  full_name: z.string().min(1, 'Họ tên không được trống').regex(/^[\p{L}\s]+$/u, 'Họ tên chỉ chứa chữ cái'),
  department: z.string().default(''),
  phone: z.string().refine(val => val === '' || /^\d{10}$/.test(val), { message: 'SĐT phải gồm đúng 10 chữ số' }),
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

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface Teacher {
  id: string;
  teacher_code: string;
  full_name: string;
  department: string | null;
  phone: string | null;
  user_id: string;
  email?: string | null;
}

const defaultFormValues: TeacherFormData = {
  email: '', password: '', teacher_code: '', full_name: '', department: '', phone: '',
  _isEditing: false,
};

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [viewing, setViewing] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: defaultFormValues,
  });

  const fetchTeachers = async () => {
    const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
    if (data) {
      const userIds = data.map((t: any) => t.user_id).filter(Boolean);
      let emailMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profs } = await supabase.from('profiles').select('user_id, email').in('user_id', userIds);
        if (profs) emailMap = Object.fromEntries(profs.map((p: any) => [p.user_id, p.email]));
      }
      setTeachers(data.map((t: any) => ({ ...t, email: emailMap[t.user_id] ?? null })));
    }
  };

  useEffect(() => { fetchTeachers().finally(() => setLoading(false)); }, []);

  const resetForm = () => {
    reset(defaultFormValues);
    setEditing(null);
  };

  const handleEdit = (t: Teacher) => {
    setEditing(t);
    reset({
      teacher_code: t.teacher_code,
      full_name: t.full_name,
      department: t.department || '',
      phone: t.phone || '',
      email: '',
      password: '',
      _isEditing: true,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: TeacherFormData) => {
    const code = data.teacher_code.trim();
    const dupCode = await supabase.from('teachers').select('id').eq('teacher_code', code).maybeSingle();
    if (dupCode.data && dupCode.data.id !== editing?.id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã giảng viên đã tồn tại' });
      return;
    }

    if (editing) {
      const { error } = await supabase.from('teachers').update({
        teacher_code: data.teacher_code.trim(),
        full_name: data.full_name.trim(),
        department: data.department.trim() || null,
        phone: data.phone.trim() || null,
      }).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
      toast({ title: 'Cập nhật giảng viên thành công' });
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
      const [teacherRes, roleRes] = await Promise.all([
        supabase.from('teachers').insert({
          user_id: userId,
          teacher_code: data.teacher_code.trim(),
          full_name: data.full_name.trim(),
          department: data.department.trim() || null,
          phone: data.phone.trim() || null,
        }),
        supabase.from('user_roles').insert({ user_id: userId, role: 'teacher' }),
      ]);
      if (teacherRes.error || roleRes.error) {
        toast({ variant: 'destructive', title: 'Lỗi', description: teacherRes.error?.message || roleRes.error?.message });
        return;
      }
      toast({ title: 'Thêm giảng viên thành công' });
    }

    setDialogOpen(false);
    resetForm();
    fetchTeachers();
  };

  const handleDelete = async (id: string) => {
    const [coursesCount, classesCount] = await Promise.all([
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('teacher_id', id),
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('homeroom_teacher_id', id),
    ]);
    const cc = coursesCount.count ?? 0;
    const cl = classesCount.count ?? 0;
    if (cc > 0 || cl > 0) {
      const parts: string[] = [];
      if (cc > 0) parts.push(`${cc} môn học`);
      if (cl > 0) parts.push(`${cl} lớp chủ nhiệm`);
      toast({ variant: 'destructive', title: 'Không thể xóa', description: `Giảng viên đang được gán cho ${parts.join(' và ')}. Vui lòng gỡ liên kết trước.` });
      return;
    }
    await supabase.from('teachers').delete().eq('id', id);
    toast({ title: 'Đã xóa giảng viên' });
    fetchTeachers();
  };

  const departmentOptions = Array.from(new Set(teachers.map(t => t.department).filter(Boolean))) as string[];

  const filtered = teachers.filter(t =>
    (t.full_name.toLowerCase().includes(search.toLowerCase()) || t.teacher_code.toLowerCase().includes(search.toLowerCase())) &&
    (filterDepartment === 'all' || t.department === filterDepartment)
  );

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Giảng viên</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Giảng viên</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa Giảng viên' : 'Thêm Giảng viên'}</DialogTitle></DialogHeader>
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
                <Label required>Mã Giảng viên</Label>
                <Input {...register('teacher_code')} />
                {errors.teacher_code && <p className="text-sm text-red-500 mt-1">{errors.teacher_code.message}</p>}
              </div>
              <div>
                <Label required>Họ tên</Label>
                <Input {...register('full_name')} />
                {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <Label>Khoa</Label>
                <Input {...register('department')} />
              </div>
              <div>
                <Label>Điện thoại</Label>
                <Input {...register('phone')} />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}
              </div>
              <Button onClick={handleSubmit(onSubmit)} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm giảng viên..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Khoa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khoa</SelectItem>
            {departmentOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead>Mã GV</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Khoa</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t, i) => (
              <TableRow key={t.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><button onClick={() => setViewing(t)} className="font-mono text-sm text-primary hover:underline">{t.teacher_code}</button></TableCell>
                <TableCell className="font-medium">{t.full_name}</TableCell>
                <TableCell>{t.department || '—'}</TableCell>
                <TableCell>{t.email || '—'}</TableCell>
                <TableCell>{t.phone || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil size={14} /></Button>
                    <ConfirmDeleteButton onConfirm={() => handleDelete(t.id)} description={`Bạn có chắc muốn xóa giảng viên "${t.full_name}" (${t.teacher_code})? Hành động này không thể hoàn tác.`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Không tìm thấy giảng viên</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết giảng viên</DialogTitle></DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Mã GV</dt><dd className="col-span-2 font-mono">{viewing.teacher_code}</dd>
              <dt className="text-muted-foreground">Họ tên</dt><dd className="col-span-2 font-medium">{viewing.full_name}</dd>
              <dt className="text-muted-foreground">Khoa</dt><dd className="col-span-2">{viewing.department || '—'}</dd>
              <dt className="text-muted-foreground">Email</dt><dd className="col-span-2">{viewing.email || '—'}</dd>
              <dt className="text-muted-foreground">Điện thoại</dt><dd className="col-span-2">{viewing.phone || '—'}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageTeachers;
