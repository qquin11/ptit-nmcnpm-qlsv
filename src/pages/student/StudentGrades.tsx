import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL = '__all__';

const fmt = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : Number(n).toFixed(2));

const StudentGrades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>(ALL);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!student) return;
      const { data } = await supabase
        .from('grades')
        .select('*, courses(course_name, course_code, credits), semesters(id, name, start_date)')
        .eq('student_id', student.id);
      if (data) setGrades(data);
    };
    fetch();
  }, [user]);

  const semesterOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; start_date: string }>();
    grades.forEach((g) => {
      const s = g.semesters as any;
      if (s?.id && !map.has(s.id)) map.set(s.id, { id: s.id, name: s.name, start_date: s.start_date });
    });
    return Array.from(map.values()).sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  }, [grades]);

  const groups = useMemo(() => {
    const filtered = selectedSemester === ALL
      ? grades
      : grades.filter((g) => (g.semesters as any)?.id === selectedSemester);
    const map = new Map<string, { id: string; name: string; start_date: string; rows: any[] }>();
    filtered.forEach((g) => {
      const s = g.semesters as any;
      const key = s?.id ?? '__none__';
      if (!map.has(key)) {
        map.set(key, { id: key, name: s?.name ?? 'Chưa có học kỳ', start_date: s?.start_date ?? '', rows: [] });
      }
      map.get(key)!.rows.push(g);
    });
    return Array.from(map.values()).sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  }, [grades, selectedSemester]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Điểm số của tôi</h1>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={selectedSemester} onValueChange={setSelectedSemester}>
          <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả học kỳ</SelectItem>
            {semesterOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groups.length === 0 && (
        <Card>
          <Table>
            <TableBody>
              <TableRow><TableCell className="text-center text-muted-foreground py-8">Chưa có điểm</TableCell></TableRow>
            </TableBody>
          </Table>
        </Card>
      )}

      {groups.length > 0 && (
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1">
      {groups.map((group) => (
        <Card key={group.id}>
          <div className="px-4 pt-4 font-semibold">{group.name}</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Mã MH</TableHead>
                <TableHead>Tên Môn học</TableHead>
                <TableHead>Số Tín chỉ</TableHead>
                <TableHead>Điểm chuyên cần (10%)</TableHead>
                <TableHead>Giữa kỳ (30%)</TableHead>
                <TableHead>Cuối kỳ (60%)</TableHead>
                <TableHead>Điểm trung bình</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.rows.map((g, i) => (
                <TableRow key={g.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{(g.courses as any)?.course_code}</TableCell>
                  <TableCell className="font-medium">{(g.courses as any)?.course_name}</TableCell>
                  <TableCell>{(g.courses as any)?.credits}</TableCell>
                  <TableCell>{fmt(g.attendance)}</TableCell>
                  <TableCell>{fmt(g.midterm)}</TableCell>
                  <TableCell>{fmt(g.final)}</TableCell>
                  <TableCell className="font-bold">{fmt(g.average)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
        </div>
      )}
    </div>
  );
};

export default StudentGrades;
