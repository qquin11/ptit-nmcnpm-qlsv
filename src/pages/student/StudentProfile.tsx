import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageLoading from '@/components/PageLoading';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('*, classes(class_name)').eq('user_id', user.id).maybeSingle();
      if (student) setProfile(student);
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
              <div><p className="text-sm text-muted-foreground">Mã sinh viên</p><p className="font-mono">{profile.student_code}</p></div>
              <div><p className="text-sm text-muted-foreground">Email</p><p>{profile.email || user?.email || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Ngày sinh</p><p>{profile.dob ? profile.dob.split('-').reverse().join('/') : '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Giới tính</p><p>{profile.gender === 'M' ? 'Nam' : profile.gender === 'F' ? 'Nữ' : '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Điện thoại</p><p>{profile.phone || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Chuyên ngành</p><p>{profile.department || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Lớp</p><p>{profile.classes?.class_name || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Địa chỉ</p><p>{profile.address || '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Trạng thái</p><p>{
                profile.status === 'active' ? 'Đang học' :
                profile.status === 'interrupted' ? 'Bảo lưu' :
                profile.status === 'terminated' ? 'Thôi học' :
                profile.status === 'graduated' ? 'Đã tốt nghiệp' : '—'
              }</p></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentProfile;
