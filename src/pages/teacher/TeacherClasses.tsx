import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TeacherClasses = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data } = await supabase.from('classes').select('*, courses(course_name)').eq('teacher_id', teacher.id);
      if (data) setClasses(data);
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('*, students(full_name, student_code, department)')
        .eq('class_id', selectedClass);
      if (data) setStudents(data);
    };
    fetchStudents();
  }, [selectedClass]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">My Classes & Students</h1>

      <div className="flex flex-wrap gap-3">
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${selectedClass === c.id ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'}`}
          >
            {c.class_name}
          </button>
        ))}
      </div>

      {selectedClass && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-sm">{(e.students as any)?.student_code}</TableCell>
                  <TableCell className="font-medium">{(e.students as any)?.full_name}</TableCell>
                  <TableCell>{(e.students as any)?.department || '—'}</TableCell>
                  <TableCell>{e.status}</TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No students enrolled</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TeacherClasses;
