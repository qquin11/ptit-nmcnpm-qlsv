import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BookOpen, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 5;

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data } = await supabase.from('courses').select('*').eq('teacher_id', teacher.id);
      if (data) setCourses(data);
    };
    fetchData().finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() =>
    courses.filter(c =>
      c.course_name.toLowerCase().includes(search.toLowerCase()) ||
      c.course_code.toLowerCase().includes(search.toLowerCase())
    ), [courses, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Tổng quan</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">Môn học của tôi</p><p className="text-2xl font-bold">{courses.length}</p></div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Danh sách môn học giảng dạy</CardTitle>
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
                <TableHead>Tín chỉ</TableHead>
                <TableHead>Khoa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell>{(currentPage - 1) * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{c.course_code}</TableCell>
                  <TableCell className="font-medium">{c.course_name}</TableCell>
                  <TableCell>{c.credits}</TableCell>
                  <TableCell>{c.department || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có môn học nào được phân công</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-4">
              <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-muted-foreground">Trang {currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
