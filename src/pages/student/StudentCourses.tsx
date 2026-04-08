import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const StudentCourses = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!student) return;
      setStudentId(student.id);

      const { data: enrolled } = await supabase
        .from('enrollments')
        .select('*, classes(class_name, courses(course_name, course_code, credits))')
        .eq('student_id', student.id);
      if (enrolled) setEnrollments(enrolled);

      const enrolledClassIds = enrolled?.map(e => e.class_id) || [];
      let query = supabase.from('classes').select('*, courses(course_name, course_code, credits), semesters(name)');
      if (enrolledClassIds.length > 0) {
        query = query.not('id', 'in', `(${enrolledClassIds.join(',')})`);
      }
      const { data: available } = await query;
      if (available) setAvailableClasses(available);
    };
    fetch();
  }, [user]);

  const handleRegister = async (classId: string) => {
    if (!studentId) return;
    const { error } = await supabase.from('enrollments').insert({ student_id: studentId, class_id: classId });
    if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
    toast({ title: 'Enrolled successfully!' });
    window.location.reload();
  };

  return (
    <div className="page-container">
      <h1 className="dashboard-header">My Courses</h1>

      <h2 className="text-lg font-semibold">Enrolled</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{(e.classes as any)?.courses?.course_name}</TableCell>
                <TableCell>{(e.classes as any)?.class_name}</TableCell>
                <TableCell>{(e.classes as any)?.courses?.credits}</TableCell>
                <TableCell><Badge>{e.status}</Badge></TableCell>
              </TableRow>
            ))}
            {enrollments.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Not enrolled in any courses</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <h2 className="text-lg font-semibold">Available Classes</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {availableClasses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{(c.courses as any)?.course_name}</TableCell>
                <TableCell>{c.class_name}</TableCell>
                <TableCell>{(c.semesters as any)?.name}</TableCell>
                <TableCell>{(c.courses as any)?.credits}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => handleRegister(c.id)}>Enroll</Button>
                </TableCell>
              </TableRow>
            ))}
            {availableClasses.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No available classes</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default StudentCourses;
