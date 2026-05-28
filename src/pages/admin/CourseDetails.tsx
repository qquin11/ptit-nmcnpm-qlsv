import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, UserPlus, Trash2 } from 'lucide-react';

const CourseDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add students dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [candidateStudents, setCandidateStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');

  // Remove students selection state
  const [selectedRemoveIds, setSelectedRemoveIds] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    if (!id) return;
    const { data: courseData } = await supabase
      .from('courses')
      .select('*, teachers(full_name), semesters(name)')
      .eq('id', id)
      .maybeSingle();
    if (courseData) setCourse(courseData);

    const { data: gradeRows } = await supabase
      .from('grades')
      .select('student_id, average, students(id, student_code, full_name, email, classes(class_name))')
      .eq('course_id', id);
    if (gradeRows) {
      setStudents(gradeRows.map((g: any) => ({ ...g.students, average: g.average })));
    }
    setSelectedRemoveIds(new Set());
  };

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [id]);

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_code?.toLowerCase().includes(search.toLowerCase())
  );

  // Add students logic
  const openAddStudents = async () => {
    setSelectedStudentIds(new Set());
    setStudentSearch('');
    const enrolledIds = new Set(students.map(s => s.id));
    const { data: st } = await supabase.from('students').select('id, student_code, full_name, classes(class_name)').order('full_name');
    if (st) setCandidateStudents(st.filter(s => !enrolledIds.has(s.id)));
    setAddDialogOpen(true);
  };

  const toggleStudent = (sid: string) => {
    setSelectedStudentIds(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const handleAddStudents = async () => {
    if (!course || !course.semester_id || selectedStudentIds.size === 0) return;
    const rows = Array.from(selectedStudentIds).map(student_id => ({
      student_id, course_id: course.id, semester_id: course.semester_id,
    }));
    const { error, count } = await supabase
      .from('grades')
      .upsert(rows, { onConflict: 'student_id,course_id,semester_id', ignoreDuplicates: true, count: 'exact' });
    if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
    toast({ title: `Đã thêm ${count ?? rows.length} sinh viên vào môn học` });
    setAddDialogOpen(false);
    setCandidateStudents([]);
    setSelectedStudentIds(new Set());
    fetchData();
  };

  // Remove students logic
  const toggleRemoveStudent = (sid: string) => {
    setSelectedRemoveIds(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedRemoveIds.has(s.id));

  const toggleAllRemove = () => {
    setSelectedRemoveIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach(s => next.delete(s.id));
      else filtered.forEach(s => next.add(s.id));
      return next;
    });
  };

  const handleRemoveStudents = async () => {
    if (!id || selectedRemoveIds.size === 0) return;
    const ids = Array.from(selectedRemoveIds);
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('course_id', id)
      .in('student_id', ids);
    if (error) { toast({ variant: 'destructive', title: 'Lỗi', description: error.message }); return; }
    toast({ title: `Đã xóa ${ids.length} sinh viên khỏi môn học` });
    fetchData();
  };

  if (loading) return <PageLoading />;
  if (!course) return <div className="page-container"><p>Không tìm thấy môn học</p></div>;

  return (
    <div className="page-container">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="dashboard-header !mb-0">Chi tiết môn học</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin môn học</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><p className="text-sm text-muted-foreground">Mã môn học</p><p className="font-mono">{course.course_code}</p></div>
            <div><p className="text-sm text-muted-foreground">Tên môn học</p><p className="font-medium">{course.course_name}</p></div>
            <div><p className="text-sm text-muted-foreground">Số tín chỉ</p><p>{course.credits}</p></div>
            <div><p className="text-sm text-muted-foreground">Khoa</p><p>{course.department || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Giảng viên</p><p>{course.teachers?.full_name || '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Học kỳ</p><p>{course.semester_id ? <button onClick={() => navigate(`/admin/semesters/${course.semester_id}`)} className="text-primary hover:underline">{course.semesters?.name}</button> : '—'}</p></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Danh sách sinh viên ({filtered.length})</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm sinh viên..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {selectedRemoveIds.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 size={14} className="mr-2" />Xóa ({selectedRemoveIds.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc muốn xóa {selectedRemoveIds.size} sinh viên khỏi môn học này? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveStudents}>Xóa</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button size="sm" onClick={openAddStudents}><UserPlus size={14} className="mr-2" />Thêm sinh viên vào môn học</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleAllRemove}
                    disabled={filtered.length === 0}
                  />
                </TableHead>
                <TableHead className="w-12">STT</TableHead>
                <TableHead>Mã SV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Điểm TB</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s, i) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => toggleRemoveStudent(s.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedRemoveIds.has(s.id)} onCheckedChange={() => toggleRemoveStudent(s.id)} />
                  </TableCell>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{s.student_code}</TableCell>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell>{s.classes?.class_name || '—'}</TableCell>
                  <TableCell>{s.email || '—'}</TableCell>
                  <TableCell className="font-bold">{s.average !== null && s.average !== undefined ? Number(s.average).toFixed(2) : '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có sinh viên nào trong môn học này</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add students dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(o) => { if (!o) { setAddDialogOpen(false); setCandidateStudents([]); setSelectedStudentIds(new Set()); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Thêm sinh viên vào môn học {course.course_name}</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm sinh viên..." className="pl-9" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    {(() => {
                      const visible = candidateStudents.filter((s) =>
                        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
                      );
                      const allSelected = visible.length > 0 && visible.every(s => selectedStudentIds.has(s.id));
                      return (
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => {
                            setSelectedStudentIds(prev => {
                              const next = new Set(prev);
                              if (allSelected) visible.forEach(s => next.delete(s.id));
                              else visible.forEach(s => next.add(s.id));
                              return next;
                            });
                          }}
                        />
                      );
                    })()}
                  </TableHead>
                  <TableHead>Mã SV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Lớp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidateStudents
                  .filter((s) =>
                    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.student_code.toLowerCase().includes(studentSearch.toLowerCase())
                  )
                  .map((s) => (
                    <TableRow key={s.id} onClick={() => toggleStudent(s.id)} className="cursor-pointer">
                      <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedStudentIds.has(s.id)} onCheckedChange={() => toggleStudent(s.id)} /></TableCell>
                      <TableCell className="font-mono text-sm">{s.student_code}</TableCell>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.classes?.class_name || '—'}</TableCell>
                    </TableRow>
                  ))}
                {candidateStudents.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Không có sinh viên</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">Đã chọn {selectedStudentIds.size} sinh viên</span>
            <Button onClick={handleAddStudents} disabled={selectedStudentIds.size === 0}>Thêm vào môn học</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetails;
