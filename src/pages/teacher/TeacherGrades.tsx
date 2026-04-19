import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const TeacherGrades = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [grades, setGrades] = useState<Record<string, { midterm: string; final: string }>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data } = await supabase.from('classes').select('*, courses(course_name)').eq('teacher_id', teacher.id);
      if (data) setClasses(data);
    };
    fetch();
  }, [user]);

  useEffect(() => {
    if (!selectedClass) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('*, students(full_name, student_code), grades(*)')
        .eq('class_id', selectedClass);
      if (data) {
        setEnrollments(data);
        const g: Record<string, { midterm: string; final: string }> = {};
        data.forEach((e: any) => {
          const grade = Array.isArray(e.grades) ? e.grades[0] : e.grades;
          g[e.id] = {
            midterm: grade?.midterm?.toString() || '',
            final: grade?.final?.toString() || '',
          };
        });
        setGrades(g);
      }
    };
    fetch();
  }, [selectedClass]);

  const handleSave = async (enrollmentId: string) => {
    const g = grades[enrollmentId];
    if (!g) return;
    const midterm = parseFloat(g.midterm) || null;
    const final_val = parseFloat(g.final) || null;

    const enrollment = enrollments.find(e => e.id === enrollmentId);
    const existingGrade = Array.isArray(enrollment?.grades) ? enrollment.grades[0] : enrollment?.grades;

    if (existingGrade) {
      await supabase.from('grades').update({ midterm, final: final_val }).eq('id', existingGrade.id);
    } else {
      await supabase.from('grades').insert({ enrollment_id: enrollmentId, midterm, final: final_val });
    }
    toast({ title: 'Đã lưu điểm' });
  };

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Nhập điểm</h1>

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
                <TableHead>Sinh viên</TableHead>
                <TableHead>Giữa kỳ</TableHead>
                <TableHead>Cuối kỳ</TableHead>
                <TableHead className="w-20">Lưu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{(e.students as any)?.full_name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20"
                      value={grades[e.id]?.midterm || ''}
                      onChange={(ev) => setGrades({ ...grades, [e.id]: { ...grades[e.id], midterm: ev.target.value } })}
                      min="0" max="100"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20"
                      value={grades[e.id]?.final || ''}
                      onChange={(ev) => setGrades({ ...grades, [e.id]: { ...grades[e.id], final: ev.target.value } })}
                      min="0" max="100"
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleSave(e.id)}>
                      <Save size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {enrollments.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Chưa có sinh viên</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TeacherGrades;
