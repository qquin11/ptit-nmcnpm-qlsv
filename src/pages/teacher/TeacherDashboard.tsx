import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { School } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data } = await supabase
        .from('classes')
        .select('*, courses(course_name, course_code), semesters(name)')
        .eq('teacher_id', teacher.id);
      if (data) setClasses(data);
    };
    fetchData();
  }, [user]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Bảng điều khiển Giảng viên</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <School size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">Lớp của tôi</p><p className="text-2xl font-bold">{classes.length}</p></div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Danh sách lớp giảng dạy</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Lớp</TableHead>
                <TableHead>Môn học</TableHead>
                <TableHead>Học kỳ</TableHead>
                <TableHead>Sĩ số tối đa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.class_name}</TableCell>
                  <TableCell>{(c.courses as any)?.course_name}</TableCell>
                  <TableCell>{(c.semesters as any)?.name}</TableCell>
                  <TableCell>{c.max_students}</TableCell>
                </TableRow>
              ))}
              {classes.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Chưa có lớp nào được phân công</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
