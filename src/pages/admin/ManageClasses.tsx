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

const classFormSchema = z.object({
  class_name: z.string().min(1, 'Tên lớp không được trống').max(40, 'Tên lớp tối đa 40 ký tự').regex(/^[a-zA-Z0-9\s]+$/, 'Tên lớp chỉ chứa chữ, số và khoảng trắng'),
  major: z.string().min(1, 'Chuyên ngành không được trống').max(40, 'Chuyên ngành tối đa 40 ký tự').regex(/^[a-zA-Z0-9\s]+$/, 'Chuyên ngành chỉ chứa chữ, số và khoảng trắng'),
  homeroom_teacher_id: z.string().min(1, 'Vui lòng chọn giáo viên chủ nhiệm'),
});

type ClassFormData = z.infer<typeof classFormSchema>;

const defaultFormValues: ClassFormData = { class_name: '', major: '', homeroom_teacher_id: '' };

const ManageClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterMajor, setFilterMajor] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    defaultValues: defaultFormValues,
  });

  const fetchData = async () => {
    const [cl, te] = await Promise.all([
      supabase.from('classes').select('*, teachers:homeroom_teacher_id(full_name)').order('created_at', { ascending: false }),
      supabase.from('teachers').select('id, full_name'),
    ]);
    if (cl.data) setClasses(cl.data);
    if (te.data) setTeachers(te.data);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, []);

  const resetForm = () => { reset(defaultFormValues); setEditing(null); };

  const handleEdit = (c: any) => {
    setEditing(c);
    reset({ class_name: c.class_name, major: c.major || '', homeroom_teacher_id: c.homeroom_teacher_id || '' });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ClassFormData) => {
    const name = data.class_name.trim();
    const dup = await supabase.from('classes').select('id').eq('class_name', name).maybeSingle();
    if (dup.data && dup.data.id !== editing?.id) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Tên lớp đã tồn tại' });
      return;
    }
    const payload = {
      class_name: name,
      major: data.major.trim(),
      homeroom_teacher_id: data.homeroom_teacher_id,
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
    const { count } = await supabase.from('students').select('id', { count: 'exact', head: true }).eq('class_id', id);
    if ((count ?? 0) > 0) {
      toast({ variant: 'destructive', title: 'Không thể xóa', description: `Lớp này đang có ${count} sinh viên. Vui lòng chuyển sinh viên sang lớp khác trước.` });
      return;
    }
    await supabase.from('classes').delete().eq('id', id);
    toast({ title: 'Đã xóa lớp' });
    fetchData();
  };

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Lớp</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Lớp</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa Lớp' : 'Thêm Lớp'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label required>Tên Lớp</Label>
                <Input placeholder="VD: D20CN01" {...register('class_name')} />
                {errors.class_name && <p className="text-sm text-red-500 mt-1">{errors.class_name.message}</p>}
              </div>
              <div>
                <Label required>Chuyên ngành</Label>
                <Input {...register('major')} />
                {errors.major && <p className="text-sm text-red-500 mt-1">{errors.major.message}</p>}
              </div>
              <div>
                <Label required>Giáo viên chủ nhiệm</Label>
                <Controller
                  control={control}
                  name="homeroom_teacher_id"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Chọn giáo viên chủ nhiệm" /></SelectTrigger>
                      <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.homeroom_teacher_id && <p className="text-sm text-red-500 mt-1">{errors.homeroom_teacher_id.message}</p>}
              </div>
              <Button onClick={handleSubmit(onSubmit)} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
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
                <TableCell><button onClick={() => navigate(`/admin/classes/${c.id}`)} className="font-medium text-primary hover:underline">{c.class_name}</button></TableCell>
                <TableCell>{c.major || '—'}</TableCell>
                <TableCell>{(c.teachers as any)?.full_name || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
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
    </div>
  );
};

export default ManageClasses;
