import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data } = await supabase.from('courses').select('*').eq('teacher_id', teacher.id);
      if (data) setCourses(data);
    };
    fetchData();
  }, [user]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Bảng điều khiển Giảng viên</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">Môn học của tôi</p><p className="text-2xl font-bold">{courses.length}</p></div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Danh sách môn học giảng dạy</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã MH</TableHead>
                <TableHead>Tên Môn học</TableHead>
                <TableHead>Tín chỉ</TableHead>
                <TableHead>Khoa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">{c.course_code}</TableCell>
                  <TableCell className="font-medium">{c.course_name}</TableCell>
                  <TableCell>{c.credits}</TableCell>
                  <TableCell>{c.department || '—'}</TableCell>
                </TableRow>
              ))}
              {courses.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Chưa có môn học nào được phân công</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
