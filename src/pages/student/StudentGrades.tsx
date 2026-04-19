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
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, classes(class_name, courses(course_name, course_code)), grades(*)')
        .eq('student_id', student.id);
      if (enrollments) setGrades(enrollments);
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
              <TableHead>Môn học</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Giữa kỳ</TableHead>
              <TableHead>Cuối kỳ</TableHead>
              <TableHead>Tổng</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((e) => {
              const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades;
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{(e.classes as any)?.courses?.course_name}</TableCell>
                  <TableCell>{(e.classes as any)?.class_name}</TableCell>
                  <TableCell>{grade?.midterm ?? '—'}</TableCell>
                  <TableCell>{grade?.final ?? '—'}</TableCell>
                  <TableCell className="font-bold">{grade?.total ?? '—'}</TableCell>
                </TableRow>
              );
            })}
            {grades.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có điểm</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default StudentGrades;
