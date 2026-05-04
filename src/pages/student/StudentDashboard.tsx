import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('*').eq('user_id', user.id).maybeSingle();
      if (student) setProfile(student);
    };
    fetch();
  }, [user]);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Bảng điều khiển</h1>

      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin cá nhân</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="text-sm text-muted-foreground">Họ tên</p><p className="font-medium">{profile.full_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Mã sinh viên</p><p className="font-mono">{profile.student_code}</p></div>
              <div><p className="text-sm text-muted-foreground">Khoa</p><p>{profile.department || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Ngày sinh</p><p>{profile.dob || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Điện thoại</p><p>{profile.phone || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Email</p><p>{user?.email}</p></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboard;
