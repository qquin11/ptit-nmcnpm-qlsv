import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, GraduationCap, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const ALL = '__all__';
const PASS_THRESHOLD = 4;

const fmt = (n: number | null): string => (n === null ? '—' : n.toFixed(2));

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<{ id: string; name: string; start_date: string }[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>(ALL);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!student) return;
      const { data } = await supabase
        .from('grades')
        .select('*, courses(course_code, course_name, credits), semesters(id, name, start_date)')
        .eq('student_id', student.id);
      if (data) {
        setGrades(data);
        const semMap = new Map<string, { id: string; name: string; start_date: string }>();
        data.forEach((g: any) => {
          const s = g.semesters as any;
          if (s?.id && !semMap.has(s.id)) semMap.set(s.id, { id: s.id, name: s.name, start_date: s.start_date });
        });
        setSemesters(Array.from(semMap.values()).sort((a, b) => (a.start_date < b.start_date ? 1 : -1)));
      }
    };
    fetchData().finally(() => setLoading(false));
  }, [user]);

  const courseCount = grades.length;
  const totalCredits = grades.reduce((sum: number, g: any) => sum + ((g.courses as any)?.credits || 0), 0);
  const scored = grades.filter((g: any) => g.average !== null && g.average !== undefined);
  const overallAverage = scored.length > 0
    ? scored.reduce((sum: number, g: any) => sum + Number(g.average), 0) / scored.length
    : null;

  const chartData = useMemo(() => {
    const filtered = grades.filter(g =>
      selectedSemester === ALL || (g.semesters as any)?.id === selectedSemester
    );
    return filtered
      .filter(g => g.average !== null && g.average !== undefined)
      .map(g => ({
        code: (g.courses as any)?.course_code || '—',
        average: Number(Number(g.average).toFixed(1)),
        pass: Number(g.average) >= PASS_THRESHOLD,
      }));
  }, [grades, selectedSemester]);

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Tổng quan</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">Số môn học</p><p className="text-2xl font-bold">{courseCount}</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <GraduationCap size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">Tổng tín chỉ</p><p className="text-2xl font-bold">{totalCredits}</p></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">Điểm trung bình tích lũy</p><p className="text-2xl font-bold">{fmt(overallAverage)}</p></div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-muted-foreground" />
            <CardTitle className="text-base">Biểu đồ kết quả học tập</CardTitle>
          </div>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả học kỳ</SelectItem>
              {semesters.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Chưa có dữ liệu điểm</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="code" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(1), 'Điểm TB']}
                    contentStyle={{ borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="average" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    <LabelList dataKey="average" position="top" style={{ fontSize: 12, fontWeight: 600 }} />
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.pass ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#22c55e]" />
                  <span className="text-sm text-muted-foreground">Đạt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm bg-[#ef4444]" />
                  <span className="text-sm text-muted-foreground">Không đạt</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
