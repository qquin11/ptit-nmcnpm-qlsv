import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 20;
const ALL = '__all__';

interface Row {
  id: string;
  studentCode: string;
  fullName: string;
  className: string;
  classId: string | null;
  department: string;
  semesterName: string;
  semesterId: string | null;
  courseName: string;
  courseId: string | null;
}

const TeacherClasses = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>(ALL);
  const [semesterFilter, setSemesterFilter] = useState<string>(ALL);
  const [classFilter, setClassFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data: courses } = await supabase.from('courses').select('id').eq('teacher_id', teacher.id);
      const courseIds = (courses || []).map((c: any) => c.id);
      if (courseIds.length === 0) { setRows([]); return; }
      const { data } = await supabase
        .from('grades')
        .select('id, semester_id, course_id, courses(course_name), students(full_name, student_code, department, class_id, classes(class_name)), semesters(name)')
        .in('course_id', courseIds);
      const mapped: Row[] = (data || []).map((g: any) => ({
        id: g.id,
        studentCode: g.students?.student_code ?? '',
        fullName: g.students?.full_name ?? '',
        className: g.students?.classes?.class_name ?? '—',
        classId: g.students?.class_id ?? null,
        department: g.students?.department ?? '—',
        semesterName: g.semesters?.name ?? '—',
        semesterId: g.semester_id ?? null,
        courseName: g.courses?.course_name ?? '—',
        courseId: g.course_id ?? null,
      }));
      setRows(mapped);
    };
    load();
  }, [user]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(r => { if (r.courseId) map.set(r.courseId, r.courseName); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rows]);

  const semesterOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(r => { if (r.semesterId) map.set(r.semesterId, r.semesterName); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rows]);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(r => { if (r.classId) map.set(r.classId, r.className); });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => rows.filter(r =>
    (courseFilter === ALL || r.courseId === courseFilter) &&
    (semesterFilter === ALL || r.semesterId === semesterFilter) &&
    (classFilter === ALL || r.classId === classFilter),
  ), [rows, courseFilter, semesterFilter, classFilter]);

  useEffect(() => { setPage(1); }, [courseFilter, semesterFilter, classFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Danh sách môn học và sinh viên</h1>

      <div className="grid gap-3 sm:grid-cols-3 max-w-3xl">
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger><SelectValue placeholder="Học kỳ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả học kỳ</SelectItem>
            {semesterOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger><SelectValue placeholder="Môn học" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả môn học</SelectItem>
            {courseOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger><SelectValue placeholder="Lớp" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tất cả lớp</SelectItem>
            {classOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã SV</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Khoa</TableHead>
              <TableHead>Môn học</TableHead>
              <TableHead>Học kỳ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.studentCode}</TableCell>
                <TableCell className="font-medium">{r.fullName}</TableCell>
                <TableCell>{r.className}</TableCell>
                <TableCell>{r.department}</TableCell>
                <TableCell>{r.courseName}</TableCell>
                <TableCell>{r.semesterName}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có sinh viên đăng ký</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {filtered.length > PAGE_SIZE && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); if (currentPage > 1) setPage(currentPage - 1); }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === currentPage}
                  onClick={(e) => { e.preventDefault(); setPage(p); }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setPage(currentPage + 1); }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default TeacherClasses;
