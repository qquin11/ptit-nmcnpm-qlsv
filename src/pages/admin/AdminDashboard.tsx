import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, School } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(230,75%,57%)', 'hsl(160,70%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(280,60%,50%)'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, classes: 0 });
  const [deptData, setDeptData] = useState<{ name: string; value: number }[]>([]);
  const [gradeData, setGradeData] = useState<{ name: string; avg: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [s, t, c, cl] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('teachers').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        students: s.count ?? 0,
        teachers: t.count ?? 0,
        courses: c.count ?? 0,
        classes: cl.count ?? 0,
      });

      // Students by department
      const { data: students } = await supabase.from('students').select('department');
      if (students) {
        const depts: Record<string, number> = {};
        students.forEach((s) => {
          const d = s.department || 'Unassigned';
          depts[d] = (depts[d] || 0) + 1;
        });
        setDeptData(Object.entries(depts).map(([name, value]) => ({ name, value })));
      }

      // Average grades
      const { data: grades } = await supabase.from('grades').select('total, enrollment_id');
      if (grades && grades.length > 0) {
        const avg = grades.reduce((sum, g) => sum + (Number(g.total) || 0), 0) / grades.length;
        setGradeData([
          { name: 'Average', avg: Math.round(avg * 100) / 100 },
          { name: 'Max Possible', avg: 100 },
        ]);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.students, icon: <GraduationCap size={24} />, color: 'text-primary' },
    { label: 'Total Teachers', value: stats.teachers, icon: <Users size={24} />, color: 'text-accent' },
    { label: 'Total Courses', value: stats.courses, icon: <BookOpen size={24} />, color: 'text-warning' },
    { label: 'Total Classes', value: stats.classes, icon: <School size={24} />, color: 'text-info' },
  ];

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold">{s.value}</p>
              </div>
              <div className={s.color}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Students by Department</CardTitle></CardHeader>
          <CardContent>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {deptData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No student data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Grade Statistics</CardTitle></CardHeader>
          <CardContent>
            {gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="avg" fill="hsl(230,75%,57%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No grade data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
