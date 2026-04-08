import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { School, Users, BookOpen } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      setTeacherId(teacher.id);
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
      <h1 className="dashboard-header">Teacher Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <School size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">My Classes</p><p className="text-2xl font-bold">{classes.length}</p></div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">My Teaching Classes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Max Students</TableHead>
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
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No classes assigned</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
