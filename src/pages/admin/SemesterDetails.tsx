import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search } from 'lucide-react';

const SemesterDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [semester, setSemester] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    const { data: sem } = await supabase
      .from('semesters')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (sem) setSemester(sem);

    const { data: co } = await supabase
      .from('courses')
      .select('id, course_code, course_name, credits, department, teachers(full_name)')
      .eq('semester_id', id)
      .order('course_name');
    if (co) setCourses(co);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [id]);

  const filtered = courses.filter(c =>
    c.course_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.course_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoading />;
  if (!semester) return <div className="page-container"><p>Không tìm thấy học kỳ</p></div>;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/semesters')}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="dashboard-header !mb-0">Chi tiết học kỳ</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin học kỳ</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-sm text-muted-foreground">Tên học kỳ</p><p className="font-medium">{semester.name}</p></div>
            <div><p className="text-sm text-muted-foreground">Ngày bắt đầu</p><p>{semester.start_date?.split('-').reverse().join('/')}</p></div>
            <div><p className="text-sm text-muted-foreground">Ngày kết thúc</p><p>{semester.end_date?.split('-').reverse().join('/')}</p></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Danh sách môn học ({filtered.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm môn học..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Mã MH</TableHead>
                <TableHead>Tên Môn học</TableHead>
                <TableHead>Số tín chỉ</TableHead>
                <TableHead>Khoa</TableHead>
                <TableHead>Giảng viên</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <button onClick={() => navigate(`/admin/courses/${c.id}`)} className="font-mono text-sm text-primary hover:underline">{c.course_code}</button>
                  </TableCell>
                  <TableCell className="font-medium">{c.course_name}</TableCell>
                  <TableCell>{c.credits}</TableCell>
                  <TableCell>{c.department || '—'}</TableCell>
                  <TableCell>{(c.teachers as any)?.full_name || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có môn học nào trong học kỳ này</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SemesterDetails;
