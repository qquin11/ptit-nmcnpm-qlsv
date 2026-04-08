import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const StudentSchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!student) return;
      const { data: enrollments } = await supabase.from('enrollments').select('class_id').eq('student_id', student.id);
      if (!enrollments || enrollments.length === 0) return;
      const classIds = enrollments.map(e => e.class_id);
      const { data } = await supabase
        .from('schedules')
        .select('*, classes(class_name, courses(course_name))')
        .in('class_id', classIds)
        .order('day_of_week');
      if (data) setSchedules(data);
    };
    fetch();
  }, [user]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="page-container">
      <h1 className="dashboard-header">My Schedule</h1>
      {days.map(day => {
        const daySchedules = schedules.filter(s => s.day_of_week === day);
        if (daySchedules.length === 0) return null;
        return (
          <div key={day}>
            <h2 className="text-lg font-semibold mb-2">{day}</h2>
            <Card className="mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Room</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daySchedules.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{s.start_time} – {s.end_time}</TableCell>
                      <TableCell>{(s.classes as any)?.courses?.course_name}</TableCell>
                      <TableCell>{(s.classes as any)?.class_name}</TableCell>
                      <TableCell>{s.room || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        );
      })}
      {schedules.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">No schedule entries found</Card>
      )}
    </div>
  );
};

export default StudentSchedule;
