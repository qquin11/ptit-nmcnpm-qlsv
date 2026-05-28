import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import PageLoading from '@/components/PageLoading';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Search } from 'lucide-react';
import { ConfirmDeleteButton } from '@/components/ConfirmDeleteButton';

const semesterFormSchema = z.object({
  name: z.string().min(1, 'Tên học kỳ không được trống').max(40, 'Tên học kỳ tối đa 40 ký tự'),
  start_date: z.string().min(1, 'Ngày bắt đầu không được trống'),
  end_date: z.string().min(1, 'Ngày kết thúc không được trống'),
}).superRefine((data, ctx) => {
  if (data.start_date && data.end_date && data.start_date >= data.end_date) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_date'], message: 'Ngày kết thúc phải sau ngày bắt đầu' });
  }
});

type SemesterFormData = z.infer<typeof semesterFormSchema>;

const defaultFormValues: SemesterFormData = { name: '', start_date: '', end_date: '' };

const ManageSemesters = () => {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SemesterFormData>({
    resolver: zodResolver(semesterFormSchema),
    defaultValues: defaultFormValues,
  });

  const fetchData = async () => {
    const { data } = await supabase.from('semesters').select('*').order('start_date', { ascending: false });
    if (data) setSemesters(data);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, []);

  const resetForm = () => { reset(defaultFormValues); setEditing(null); };

  const handleEdit = (s: any) => {
    setEditing(s);
    reset({ name: s.name, start_date: s.start_date, end_date: s.end_date });
    setDialogOpen(true);
  };

  const onSubmit = async (data: SemesterFormData) => {
    const payload = { name: data.name.trim(), start_date: data.start_date, end_date: data.end_date };
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
    const { count } = await supabase.from('courses').select('id', { count: 'exact', head: true }).eq('semester_id', id);
    if ((count ?? 0) > 0) {
      toast({ variant: 'destructive', title: 'Không thể xóa', description: `Học kỳ này đang có ${count} môn học liên kết. Vui lòng xóa các môn học trước.` });
      return;
    }
    await supabase.from('semesters').delete().eq('id', id);
    toast({ title: 'Đã xóa học kỳ' });
    fetchData();
  };

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Quản lý Học kỳ</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Thêm Học kỳ</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Sửa' : 'Thêm'} Học kỳ</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label required>Tên Học kỳ</Label>
                <Input placeholder="HK1 2025-2026" {...register('name')} />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <Label required>Ngày bắt đầu</Label>
                <Input type="date" {...register('start_date')} />
                {errors.start_date && <p className="text-sm text-red-500 mt-1">{errors.start_date.message}</p>}
              </div>
              <div>
                <Label required>Ngày kết thúc</Label>
                <Input type="date" {...register('end_date')} />
                {errors.end_date && <p className="text-sm text-red-500 mt-1">{errors.end_date.message}</p>}
              </div>
              <Button onClick={handleSubmit(onSubmit)} className="w-full">{editing ? 'Cập nhật' : 'Tạo mới'}</Button>
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
                <TableCell><button onClick={() => setViewing(s)} className="font-medium text-primary hover:underline">{s.name}</button></TableCell>
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

      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Chi tiết học kỳ</DialogTitle></DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Tên học kỳ</dt><dd className="col-span-2 font-medium">{viewing.name}</dd>
              <dt className="text-muted-foreground">Ngày bắt đầu</dt><dd className="col-span-2">{viewing.start_date}</dd>
              <dt className="text-muted-foreground">Ngày kết thúc</dt><dd className="col-span-2">{viewing.end_date}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageSemesters;
