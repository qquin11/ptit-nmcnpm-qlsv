import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useForm, Controller } from 'react-hook-form';
import PageLoading from '@/components/PageLoading';
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

const courseFormSchema = z.object({
  course_code: z.string().min(1, 'Mã môn học không được trống').max(10, 'Mã môn học tối đa 10 ký tự').regex(/^[a-zA-Z0-9]+$/, 'Mã môn học chỉ chứa chữ và số'),
  course_name: z.string().min(1, 'Tên môn học không được trống').max(40, 'Tên môn học tối đa 40 ký tự').regex(/^[\p{L}0-9\s]+$/u, 'Tên môn học chỉ chứa chữ, số và khoảng trắng'),
  credits: z.string().min(1, 'Số tín chỉ không được trống').regex(/^\d$/, 'Số tín chỉ phải là 1 chữ số'),
  department: z.string().min(1, 'Khoa không được trống'),
  teacher_id: z.string().min(1, 'Vui lòng chọn giảng viên'),
  semester_id: z.string().min(1, 'Vui lòng chọn học kỳ'),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

const defaultFormValues: CourseFormData = { course_code: '', course_name: '', credits: '3', department: '', teacher_id: '', semester_id: '' };

const ManageCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: defaultFormValues,
  });

  const fetchData = async () => {
    const [co, te, se] = await Promise.all([
      supabase.from('courses').select('*, teachers(full_name), semesters(name)').order('created_at', { ascending: false }),
      supabase.from('teachers').select('id, full_name'),
      supabase.from('semesters').select('id, name').order('start_date', { ascending: false }),
    ]);
    if (co.data) setCourses(co.data);
    if (te.data) setTeachers(te.data);
    if (se.data) setSemesters(se.data);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, []);

  const resetForm = () => { reset(defaultFormValues); setEditing(null); };

  const handleEdit = (c: any) => {
    setEditing(c);
    reset({ course_code: c.course_code, course_name: c.course_name, credits: String(c.credits), department: c.department || '', teacher_id: c.teacher_id || '', semester_id: c.semester_id || '' });
    setDialogOpen(true);
  };

  const onSubmit = async (data: CourseFormData) => {
    const code = data.course_code.trim();
    const dup = await supabase.from('courses').select('id').eq('course_code', code).maybeSingle();
    if (dup.data && dup.data.id !== editing?.id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Mã môn học đã tồn tại' });
      return;
    }
    const payload = {
      course_code: code,
      course_name: data.course_name.trim(),
      credits: parseInt(data.credits) || 3,
      department: data.department.trim(),
      teacher_id: data.teacher_id,
      semester_id: data.semester_id,
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

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Môn học</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Môn học</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa Môn học' : 'Thêm Môn học'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label required>Mã Môn học</Label>
                <Input {...register('course_code')} />
                {errors.course_code && <p className="text-sm text-red-500 mt-1">{errors.course_code.message}</p>}
              </div>
              <div>
                <Label required>Tên Môn học</Label>
                <Input {...register('course_name')} />
                {errors.course_name && <p className="text-sm text-red-500 mt-1">{errors.course_name.message}</p>}
              </div>
              <div>
                <Label required>Số tín chỉ</Label>
                <Input type="number" {...register('credits')} />
                {errors.credits && <p className="text-sm text-red-500 mt-1">{errors.credits.message}</p>}
              </div>
              <div>
                <Label required>Khoa</Label>
                <Input {...register('department')} />
                {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>}
              </div>
              <div>
                <Label required>Giảng viên</Label>
                <Controller
                  control={control}
                  name="teacher_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                      <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.teacher_id && <p className="text-sm text-red-500 mt-1">{errors.teacher_id.message}</p>}
              </div>
              <div>
                <Label required>Học kỳ</Label>
                <Controller
                  control={control}
                  name="semester_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
                      <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.semester_id && <p className="text-sm text-red-500 mt-1">{errors.semester_id.message}</p>}
              </div>
              <Button onClick={handleSubmit(onSubmit)} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm môn học..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Khoa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả khoa</SelectItem>
            {Array.from(new Set(courses.map((c: any) => c.department).filter(Boolean))).map((d: any) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSemester} onValueChange={setFilterSemester}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Học kỳ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả học kỳ</SelectItem>
            {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">STT</TableHead>
              <TableHead>Mã MH</TableHead>
              <TableHead>Tên Môn học</TableHead>
              <TableHead>Số tín chỉ</TableHead>
              <TableHead>Khoa</TableHead>
              <TableHead>Giảng viên</TableHead>
              <TableHead>Học kỳ</TableHead>
              <TableHead className="w-24">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.filter(c =>
              (c.course_name.toLowerCase().includes(search.toLowerCase()) ||
                c.course_code.toLowerCase().includes(search.toLowerCase())) &&
              (filterDepartment === 'all' || c.department === filterDepartment) &&
              (filterSemester === 'all' || c.semester_id === filterSemester)
            ).map((c, i) => (
              <TableRow key={c.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell><button onClick={() => navigate(`/admin/courses/${c.id}`)} className="font-mono text-sm text-primary hover:underline">{c.course_code}</button></TableCell>
                <TableCell className="font-medium">{c.course_name}</TableCell>
                <TableCell>{c.credits}</TableCell>
                <TableCell>{c.department || '—'}</TableCell>
                <TableCell>{(c.teachers as any)?.full_name || '—'}</TableCell>
                <TableCell>{c.semester_id ? <button onClick={() => navigate(`/admin/semesters/${c.semester_id}`)} className="text-primary hover:underline">{(c.semesters as any)?.name}</button> : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
                    <ConfirmDeleteButton onConfirm={() => handleDelete(c.id)} description={`Bạn có chắc muốn xóa môn học "${c.course_name}"? Hành động này không thể hoàn tác.`} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {courses.filter(c =>
              (c.course_name.toLowerCase().includes(search.toLowerCase()) ||
                c.course_code.toLowerCase().includes(search.toLowerCase())) &&
              (filterDepartment === 'all' || c.department === filterDepartment) &&
              (filterSemester === 'all' || c.semester_id === filterSemester)
            ).length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Không tìm thấy môn học</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

    </div>
  );
};

export default ManageCourses;
