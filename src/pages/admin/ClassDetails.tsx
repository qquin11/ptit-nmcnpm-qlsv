import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search } from 'lucide-react';

const ClassDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!id) return;
    const { data: cls } = await supabase
      .from('classes')
      .select('*, teachers:homeroom_teacher_id(full_name)')
      .eq('id', id)
      .maybeSingle();
    if (cls) setClassData(cls);

    const { data: st } = await supabase
      .from('students')
      .select('id, student_code, full_name, email, department')
      .eq('class_id', id)
      .order('full_name');
    if (st) setStudents(st);
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [id]);

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoading />;
  if (!classData) return <div className="page-container"><p>Không tìm thấy lớp</p></div>;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/classes')}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="dashboard-header !mb-0">Chi tiết lớp</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin lớp</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-sm text-muted-foreground">Tên lớp</p><p className="font-medium">{classData.class_name}</p></div>
            <div><p className="text-sm text-muted-foreground">Chuyên ngành</p><p>{classData.major || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Giáo viên chủ nhiệm</p><p>{classData.teachers?.full_name || '—'}</p></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Danh sách sinh viên ({filtered.length})</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm sinh viên..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Chuyên ngành</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{s.student_code}</TableCell>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell>{s.email || '—'}</TableCell>
                  <TableCell>{s.department || '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Lớp chưa có sinh viên</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassDetails;
