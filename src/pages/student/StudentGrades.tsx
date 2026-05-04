import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!student) return;
      const { data } = await supabase
        .from('grades')
        .select('*, courses(course_name, course_code, credits), semesters(name)')
        .eq('student_id', student.id);
      if (data) setGrades(data);
    };
    fetch();
  }, [user]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Điểm số của tôi</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã MH</TableHead>
              <TableHead>Môn học</TableHead>
              <TableHead>Tín chỉ</TableHead>
              <TableHead>Học kỳ</TableHead>
              <TableHead>Giữa kỳ</TableHead>
              <TableHead>Cuối kỳ</TableHead>
              <TableHead>Tổng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-mono text-sm">{(g.courses as any)?.course_code}</TableCell>
                <TableCell className="font-medium">{(g.courses as any)?.course_name}</TableCell>
                <TableCell>{(g.courses as any)?.credits}</TableCell>
                <TableCell>{(g.semesters as any)?.name || '—'}</TableCell>
                <TableCell>{g.midterm ?? '—'}</TableCell>
                <TableCell>{g.final ?? '—'}</TableCell>
                <TableCell className="font-bold">{g.total ?? '—'}</TableCell>
              </TableRow>
            ))}
            {grades.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có điểm</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default StudentGrades;
