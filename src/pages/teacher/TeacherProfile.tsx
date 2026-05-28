import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TeacherProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: teacher } = await supabase.from('teachers').select('*').eq('user_id', user.id).maybeSingle();
      if (teacher) setProfile(teacher);
    };
    fetch().finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoading />;

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Thông tin cá nhân</h1>

      {profile && (
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin cá nhân</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="text-sm text-muted-foreground">Họ tên</p><p className="font-medium">{profile.full_name}</p></div>
              <div><p className="text-sm text-muted-foreground">Mã giảng viên</p><p className="font-mono">{profile.teacher_code}</p></div>
              <div><p className="text-sm text-muted-foreground">Email</p><p>{profile.email || user?.email || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Khoa</p><p>{profile.department || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Điện thoại</p><p>{profile.phone || '—'}</p></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherProfile;
