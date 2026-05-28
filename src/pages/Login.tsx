import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (searchParams.get('reason') === 'timeout') {
      toast({ variant: 'destructive', title: 'Phiên đăng nhập hết hạn', description: 'Bạn đã không hoạt động trong 15 phút. Vui lòng đăng nhập lại.' });
    }
  }, []);

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
      <header className="relative z-20 flex items-center bg-[#0a1628] px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
            <GraduationCap size={20} className="text-white" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-white uppercase">{t('app.subtitle')}</p>
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex flex-1 items-start justify-center bg-[#0f2035] pt-28">
        <div className="flex w-full max-w-7xl gap-0 px-8">
          {/* Left: hero image area */}
          <div className="relative hidden flex-[2] overflow-hidden rounded-l-2xl md:block">
            <img src="/campus-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-[#0a1628]/30 to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end p-8">
              <h1
                className="text-4xl leading-tight font-light tracking-tight text-white lg:text-5xl"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              >
                Hệ thống
                <br />
                <span className="font-normal italic">Quản lý Sinh viên PTIT</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                Tra cứu điểm, quản lý môn học và theo dõi tiến trình học tập dễ dàng trên một nền tảng duy nhất.
              </p>
            </div>
          </div>

          {/* Right: login card */}
          <div className="flex w-full flex-1 flex-col md:mx-0">
            <div className="rounded-2xl bg-white px-10 py-24 shadow-2xl md:rounded-l-none">
              <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">Chào mừng bạn</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label required htmlFor="email">{t('login.email')}</Label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('login.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      maxLength={40}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label required htmlFor="password">{t('login.password')}</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={32}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-full bg-[#0a1628] text-white hover:bg-[#1a3050]"
                  disabled={loading}
                >
                  {loading ? t('login.submitting') : t('login.submit')}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#091420] px-6 py-3">
          <p className="text-center text-xs text-white/40">
            © {new Date().getFullYear()} Học viện Công nghệ Bưu chính Viễn thông. All Rights Reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
