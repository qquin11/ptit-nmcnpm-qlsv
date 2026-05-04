import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TeacherClasses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data } = await supabase.from('courses').select('*').eq('teacher_id', teacher.id);
      if (data) setCourses(data);
    };
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (!selectedCourse) return;
    const fetchStudents = async () => {
      const { data } = await supabase
        .from('grades')
        .select('id, semester_id, students(full_name, student_code, department, classes(class_name)), semesters(name)')
        .eq('course_id', selectedCourse);
      if (data) setStudents(data);
    };
    fetchStudents();
  }, [selectedCourse]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Môn học của tôi & Sinh viên</h1>

      <div className="flex flex-wrap gap-3">
        {courses.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCourse(c.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${selectedCourse === c.id ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'}`}
          >
            {c.course_name}
          </button>
        ))}
      </div>

      {selectedCourse && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Khoa</TableHead>
                <TableHead>Học kỳ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-sm">{(g.students as any)?.student_code}</TableCell>
                  <TableCell className="font-medium">{(g.students as any)?.full_name}</TableCell>
                  <TableCell>{(g.students as any)?.classes?.class_name || '—'}</TableCell>
                  <TableCell>{(g.students as any)?.department || '—'}</TableCell>
                  <TableCell>{(g.semesters as any)?.name || '—'}</TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Chưa có sinh viên đăng ký</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TeacherClasses;
