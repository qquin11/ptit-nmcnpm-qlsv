import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface GradeRow {
  studentId: string;
  studentCode: string;
  fullName: string;
  className: string;
  midterm: string;
  final: string;
  total: number | null;
}

const TeacherGrades = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [rows, setRows] = useState<GradeRow[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const [co, se, cl] = await Promise.all([
        supabase.from('courses').select('id, course_name, course_code').eq('teacher_id', teacher.id),
        supabase.from('semesters').select('id, name').order('start_date', { ascending: false }),
        supabase.from('classes').select('id, class_name').order('class_name'),
      ]);
      if (co.data) setCourses(co.data);
      if (se.data) setSemesters(se.data);
      if (cl.data) setClasses(cl.data);
    };
    init();
  }, [user]);

  useEffect(() => {
    if (!selectedCourse || !selectedSemester || !selectedClass) {
      setRows([]);
      return;
    }
    const load = async () => {
      const [st, gr] = await Promise.all([
        supabase.from('students').select('id, student_code, full_name, classes(class_name)').eq('class_id', selectedClass),
        supabase.from('grades').select('*').eq('course_id', selectedCourse).eq('semester_id', selectedSemester),
      ]);
      const gradeByStudent = new Map<string, any>();
      (gr.data || []).forEach((g: any) => gradeByStudent.set(g.student_id, g));
      const r: GradeRow[] = (st.data || []).map((s: any) => {
        const g = gradeByStudent.get(s.id);
        return {
          studentId: s.id,
          studentCode: s.student_code,
          fullName: s.full_name,
          className: s.classes?.class_name || '—',
          midterm: g?.midterm?.toString() || '',
          final: g?.final?.toString() || '',
          total: g?.total ?? null,
        };
      });
      setRows(r);
    };
    load();
  }, [selectedCourse, selectedSemester, selectedClass]);

  const updateRow = (studentId: string, field: 'midterm' | 'final', value: string) => {
    setRows(rows.map(r => r.studentId === studentId ? { ...r, [field]: value } : r));
  };

  const handleSave = async (row: GradeRow) => {
    const midterm = row.midterm === '' ? null : parseFloat(row.midterm);
    const final_val = row.final === '' ? null : parseFloat(row.final);
    const { error } = await supabase.from('grades').upsert({
      student_id: row.studentId,
      course_id: selectedCourse,
      semester_id: selectedSemester,
      midterm,
      final: final_val,
    }, { onConflict: 'student_id,course_id,semester_id' });
    if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
    toast({ title: 'Đã lưu điểm' });
  };

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Nhập điểm</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger><SelectValue placeholder="Chọn môn học" /></SelectTrigger>
          <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
          <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {selectedCourse && selectedSemester && selectedClass && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Giữa kỳ</TableHead>
                <TableHead>Cuối kỳ</TableHead>
                <TableHead>Tổng</TableHead>
                <TableHead className="w-20">Lưu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell className="font-mono text-sm">{r.studentCode}</TableCell>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell>
                    <Input type="number" className="w-20" value={r.midterm} min="0" max="100"
                      onChange={(ev) => updateRow(r.studentId, 'midterm', ev.target.value)} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" className="w-20" value={r.final} min="0" max="100"
                      onChange={(ev) => updateRow(r.studentId, 'final', ev.target.value)} />
                  </TableCell>
                  <TableCell className="font-bold">{r.total ?? '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleSave(r)}><Save size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có sinh viên</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TeacherGrades;
