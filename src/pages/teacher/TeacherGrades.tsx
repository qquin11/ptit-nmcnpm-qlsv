import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, X } from 'lucide-react';

const ALL = '__all__';
const fmt = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : Number(n).toFixed(2));

type GradeField = 'attendance' | 'midterm' | 'final';

interface GradeRow {
  gradeId: string;
  studentId: string;
  studentCode: string;
  fullName: string;
  classId: string | null;
  className: string;
  semesterId: string;
  semesterName: string;
  attendance: number | null;
  midterm: number | null;
  final: number | null;
  average: number | null;
}

const clamp = (raw: string): number | null => {
  if (raw.trim() === '') return null;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return null;
  if (n > 10) return 10;
  if (n < 0) return 0;
  return n;
};

const TeacherGrades = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [semesterFilter, setSemesterFilter] = useState<string>(ALL);
  const [classFilter, setClassFilter] = useState<string>(ALL);
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data: co } = await supabase.from('courses').select('id, course_name, course_code').eq('teacher_id', teacher.id);
      if (co) setCourses(co);
    };
    init().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!selectedCourse) { setRows([]); setSemesterFilter(ALL); setClassFilter(ALL); return; }
    const load = async () => {
      const { data } = await supabase
        .from('grades')
        .select('id, student_id, semester_id, attendance, midterm, final, average, students(student_code, full_name, class_id, classes(class_name)), semesters(name)')
        .eq('course_id', selectedCourse);
      const mapped: GradeRow[] = (data || []).map((g: any) => ({
        gradeId: g.id,
        studentId: g.student_id,
        studentCode: g.students?.student_code ?? '',
        fullName: g.students?.full_name ?? '',
        classId: g.students?.class_id ?? null,
        className: g.students?.classes?.class_name ?? '—',
        semesterId: g.semester_id,
        semesterName: g.semesters?.name ?? '—',
        attendance: g.attendance,
        midterm: g.midterm,
        final: g.final,
        average: g.average,
      }));
      setRows(mapped);
      setDrafts({});
    };
    load();
  }, [selectedCourse]);

  const semesterOptions = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach(r => { if (r.semesterId) m.set(r.semesterId, r.semesterName); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [rows]);

  const classOptions = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach(r => { if (r.classId) m.set(r.classId, r.className); });
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [rows]);

  const filteredRows = useMemo(() => rows.filter(r =>
    (semesterFilter === ALL || r.semesterId === semesterFilter) &&
    (classFilter === ALL || r.classId === classFilter),
  ), [rows, semesterFilter, classFilter]);

  const draftKey = (gradeId: string, field: GradeField) => `${gradeId}_${field}`;

  const handleFocus = (gradeId: string, field: GradeField, current: number | null) => {
    setDrafts(d => ({ ...d, [draftKey(gradeId, field)]: current === null ? '' : current.toFixed(2) }));
  };

  const handleChange = (gradeId: string, field: GradeField, value: string) => {
    setDrafts(d => ({ ...d, [draftKey(gradeId, field)]: value }));
  };

  const handleBlur = (gradeId: string, field: GradeField) => {
    const key = draftKey(gradeId, field);
    setDrafts(prev => {
      if (!(key in prev)) return prev;
      const num = clamp(prev[key]);
      setRows(rs => rs.map(r => r.gradeId === gradeId ? { ...r, [field]: num } : r));
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = async (gradeId: string) => {
    let saved: GradeRow | undefined;
    setRows(prev => {
      const updated = prev.map(r => {
        if (r.gradeId !== gradeId) return r;
        const merged = { ...r };
        (['attendance', 'midterm', 'final'] as GradeField[]).forEach(f => {
          const k = draftKey(gradeId, f);
          if (k in drafts) merged[f] = clamp(drafts[k]);
        });
        saved = merged;
        return merged;
      });
      return updated;
    });
    setDrafts(prev => {
      const next = { ...prev };
      (['attendance', 'midterm', 'final'] as GradeField[]).forEach(f => { delete next[draftKey(gradeId, f)]; });
      return next;
    });
    if (!saved) return;

    const { data, error } = await supabase.from('grades').upsert({
      student_id: saved.studentId,
      course_id: selectedCourse,
      semester_id: saved.semesterId,
      attendance: saved.attendance,
      midterm: saved.midterm,
      final: saved.final,
    }, { onConflict: 'student_id,course_id,semester_id' }).select('average').single();
    if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
    setRows(rs => rs.map(r => r.gradeId === gradeId ? { ...r, average: data?.average ?? null } : r));
    toast({ title: 'Đã lưu điểm' });
  };

  if (loading) return <PageLoading />;

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
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger><SelectValue placeholder="Học kỳ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả học kỳ</SelectItem>
                  {semesterOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger><SelectValue placeholder="Lớp" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Tất cả lớp</SelectItem>
                  {classOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        {selectedCourse && (
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(''); setSemesterFilter(ALL); setClassFilter(ALL); }} title="Xóa bộ lọc">
            <X size={16} />
          </Button>
        )}
      </div>

      {!selectedCourse && (
        <Card className="p-8 text-center text-muted-foreground">
          Vui lòng chọn môn học để xem danh sách
        </Card>
      )}

      {selectedCourse && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Học kỳ</TableHead>
                <TableHead>Điểm chuyên cần (10%)</TableHead>
                <TableHead>Giữa kỳ (30%)</TableHead>
                <TableHead>Cuối kỳ (60%)</TableHead>
                <TableHead>Điểm trung bình</TableHead>
                <TableHead className="w-20">Lưu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((r, i) => (
                <TableRow key={r.gradeId}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{r.studentCode}</TableCell>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell>{r.className}</TableCell>
                  <TableCell>{r.semesterName}</TableCell>
                  <TableCell>
                    <Input type="text" inputMode="decimal" className="w-20"
                      value={drafts[draftKey(r.gradeId, 'attendance')] ?? (r.attendance === null ? '' : r.attendance.toFixed(2))}
                      onFocus={() => handleFocus(r.gradeId, 'attendance', r.attendance)}
                      onChange={(ev) => handleChange(r.gradeId, 'attendance', ev.target.value)}
                      onBlur={() => handleBlur(r.gradeId, 'attendance')} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" inputMode="decimal" className="w-20"
                      value={drafts[draftKey(r.gradeId, 'midterm')] ?? (r.midterm === null ? '' : r.midterm.toFixed(2))}
                      onFocus={() => handleFocus(r.gradeId, 'midterm', r.midterm)}
                      onChange={(ev) => handleChange(r.gradeId, 'midterm', ev.target.value)}
                      onBlur={() => handleBlur(r.gradeId, 'midterm')} />
                  </TableCell>
                  <TableCell>
                    <Input type="text" inputMode="decimal" className="w-20"
                      value={drafts[draftKey(r.gradeId, 'final')] ?? (r.final === null ? '' : r.final.toFixed(2))}
                      onFocus={() => handleFocus(r.gradeId, 'final', r.final)}
                      onChange={(ev) => handleChange(r.gradeId, 'final', ev.target.value)}
                      onBlur={() => handleBlur(r.gradeId, 'final')} />
                  </TableCell>
                  <TableCell className="font-bold">{fmt(r.average)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleSave(r.gradeId)}><Save size={14} /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRows.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Chưa có sinh viên</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default TeacherGrades;
