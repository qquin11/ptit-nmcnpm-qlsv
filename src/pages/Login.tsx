import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast({ variant: 'destructive', title: t('login.failed'), description: error.message });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex min-h-screen flex-col light" data-theme="light">
      {/* Dark navy header */}
      <header className="relative z-20 flex items-center justify-between bg-[#001d3d] px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">{t('app.name')}</p>
            <p className="text-[11px] text-white/60">{t('app.subtitle')}</p>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <main className="relative flex flex-1">
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/campus-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#001d3d]/80 via-[#001d3d]/40 to-transparent" />

        {/* Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-12 px-8">
          {/* Large serif text overlay */}
          <div className="hidden max-w-xl flex-1 md:block">
            <h1
              className="text-5xl leading-tight font-light tracking-tight text-white lg:text-7xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Học tập là
              <br />
              <span className="font-normal italic">tương lai</span>
            </h1>
          </div>

          {/* Login card */}
          <div className="mx-auto w-full max-w-md md:mx-0">
            <div className="rounded-2xl border border-white/10 bg-white p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#001d3d]">
                  <GraduationCap size={24} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Chào mừng bạn đến với<br />Hệ thống Quản lý Sinh Viên</h2>
                <p className="mt-3 text-sm text-gray-500">Vui lòng đăng nhập để tiếp tục</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label required htmlFor="email">{t('login.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={40}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label required htmlFor="password">{t('login.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={32}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="h-11 w-full bg-[#001d3d] text-white hover:bg-[#003566]" disabled={loading}>
                  {loading ? t('login.submitting') : t('login.submit')}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <p className="absolute bottom-4 left-6 z-10 text-xs text-white/40">
          © {new Date().getFullYear()} Học viện công nghệ bưu chính viễn thông. All Rights Reserved.
        </p>
      </main>
    </div>
  );
};

export default Login;
