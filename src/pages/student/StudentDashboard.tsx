import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, ClipboardList } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ courses: 0, schedules: 0 });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle();
      if (student) {
        setProfile(student);
        const { data: enrollments } = await supabase.from('enrollments').select('id').eq('student_id', student.id);
        setStats(prev => ({ ...prev, courses: enrollments?.length || 0 }));
      }
    };
    fetch();
  }, [user]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Student Dashboard</h1>

      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-base">My Profile</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{profile.full_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Student Code</p><p className="font-mono">{profile.student_code}</p></div>
              <div><p className="text-sm text-muted-foreground">Department</p><p>{profile.department || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Date of Birth</p><p>{profile.dob || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Phone</p><p>{profile.phone || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Email</p><p>{user?.email}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div><p className="text-sm text-muted-foreground">Enrolled Courses</p><p className="text-2xl font-bold">{stats.courses}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
