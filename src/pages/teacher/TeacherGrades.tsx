import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

const fmt = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : Number(n).toFixed(2));

interface GradeRow {
  studentId: string;
  studentCode: string;
  fullName: string;
  className: string;
  attendance: number | null;
  midterm: number | null;
  final: number | null;
  average: number | null;
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
  const [drafts, setDrafts] = useState<Record<string, string>>({});
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
    if (!selectedCourse) { setSelectedSemester(''); setSelectedClass(''); }
  }, [selectedCourse]);

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
          attendance: g?.attendance ?? null,
          midterm: g?.midterm ?? null,
          final: g?.final ?? null,
          average: g?.average ?? null,
        };
      });
      setRows(r);
    };
    load();
  }, [selectedCourse, selectedSemester, selectedClass]);

  type GradeField = 'attendance' | 'midterm' | 'final';
  const draftKey = (studentId: string, field: GradeField) => `${studentId}_${field}`;

  const handleFocus = (studentId: string, field: GradeField, current: number | null) => {
    setDrafts(d => ({ ...d, [draftKey(studentId, field)]: current === null ? '' : current.toFixed(2) }));
  };

  const handleChange = (studentId: string, field: GradeField, value: string) => {
    setDrafts(d => ({ ...d, [draftKey(studentId, field)]: value }));
  };

  const handleBlur = (studentId: string, field: GradeField) => {
    const key = draftKey(studentId, field);
    const raw = drafts[key] ?? '';
    let num: number | null = raw.trim() === '' ? null : parseFloat(raw);
    if (num !== null && !Number.isNaN(num)) {
      if (num > 10) num = 10;
      if (num < 0) num = 0;
    } else if (num !== null && Number.isNaN(num)) {
      num = null;
    }
    setRows(rows.map(r => r.studentId === studentId ? { ...r, [field]: num } : r));
    setDrafts(d => { const n = { ...d }; delete n[key]; return n; });
  };

  const handleSave = async (row: GradeRow) => {
    const { data, error } = await supabase.from('grades').upsert({
      student_id: row.studentId,
      course_id: selectedCourse,
      semester_id: selectedSemester,
      attendance: row.attendance,
      midterm: row.midterm,
      final: row.final,
    }, { onConflict: 'student_id,course_id,semester_id' }).select('average').single();
    if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
    setRows(rows.map(r => r.studentId === row.studentId ? { ...r, average: data?.average ?? null } : r));
    toast({ title: 'Đã lưu điểm' });
  };

  const ready = selectedCourse && selectedSemester && selectedClass;

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Nhập điểm</h1>

      <div className="flex items-center gap-3">
        <div className="grid gap-3 sm:grid-cols-3 flex-1">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger><SelectValue placeholder="Chọn môn học" /></SelectTrigger>
            <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}</SelectContent>
          </Select>
          {selectedCourse && (
            <>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
                <SelectContent>{semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Chọn lớp" /></SelectTrigger>
                <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
              </Select>
            </>
          )}
        </div>
        {selectedCourse && (
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(''); setSelectedSemester(''); setSelectedClass(''); }} title="Xóa bộ lọc">
            <X size={16} />
          </Button>
        )}
      </div>

      {!ready && (
        <Card className="p-8 text-center text-muted-foreground">
          Vui lòng chọn môn học để xem danh sách
        </Card>
      )}

      {ready && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Điểm chuyên cần (10%)</TableHead>
                <TableHead>Giữa kỳ (30%)</TableHead>
                <TableHead>Cuối kỳ (60%)</TableHead>
                <TableHead>Điểm trung bình</TableHead>
                <TableHead className="w-20">Lưu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.studentId}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{r.studentCode}</TableCell>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell>
                    <Input type="text" inputMode="decimal" className="w-20"
                      value={drafts[draftKey(r.studentId, 'attendance')] ?? (r.attendance === null ? '' : r.attendance.toFixed(2))}
                      onFocus={() => handleFocus(r.studentId, 'attendance', r.attendance)}
                      onChange={(ev) => handleChange(r.studentId, 'attendance', ev.target.value)}
                      onBlur={() => handleBlur(r.studentId, 'attendance')} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" inputMode="decimal" className="w-20"
                      value={drafts[draftKey(r.studentId, 'midterm')] ?? (r.midterm === null ? '' : r.midterm.toFixed(2))}
                      onFocus={() => handleFocus(r.studentId, 'midterm', r.midterm)}
                      onChange={(ev) => handleChange(r.studentId, 'midterm', ev.target.value)}
                      onBlur={() => handleBlur(r.studentId, 'midterm')} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" inputMode="decimal" className="w-20"
                      value={drafts[draftKey(r.studentId, 'final')] ?? (r.final === null ? '' : r.final.toFixed(2))}
                      onFocus={() => handleFocus(r.studentId, 'final', r.final)}
                      onChange={(ev) => handleChange(r.studentId, 'final', ev.target.value)}
                      onBlur={() => handleBlur(r.studentId, 'final')} />
                  </TableCell>
                  <TableCell className="font-bold">{fmt(r.average)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleSave(r)}><Save size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Chưa có sinh viên</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TeacherGrades;
