import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, BookOpen, Calendar, GraduationCap,
  ClipboardList, LogOut, Menu,
  Moon, Sun, School, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ReactNode;
}

const adminNav: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
  { labelKey: 'nav.students', path: '/admin/students', icon: <GraduationCap size={18} /> },
  { labelKey: 'nav.teachers', path: '/admin/teachers', icon: <Users size={18} /> },
  { labelKey: 'nav.courses', path: '/admin/courses', icon: <BookOpen size={18} /> },
  { labelKey: 'nav.classes', path: '/admin/classes', icon: <School size={18} /> },
  { labelKey: 'nav.semesters', path: '/admin/semesters', icon: <Calendar size={18} /> },
  { labelKey: 'nav.schedules', path: '/admin/schedules', icon: <ClipboardList size={18} /> },
];

const teacherNav: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/teacher', icon: <LayoutDashboard size={18} /> },
  { labelKey: 'nav.myClasses', path: '/teacher/classes', icon: <School size={18} /> },
  { labelKey: 'nav.gradeInput', path: '/teacher/grades', icon: <ClipboardList size={18} /> },
];

const studentNav: NavItem[] = [
  { labelKey: 'nav.dashboard', path: '/student', icon: <LayoutDashboard size={18} /> },
  { labelKey: 'nav.schedule', path: '/student/schedule', icon: <Calendar size={18} /> },
  { labelKey: 'nav.grades', path: '/student/grades', icon: <ClipboardList size={18} /> },
];

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const navItems = role === 'admin' ? adminNav : role === 'teacher' ? teacherNav : studentNav;
  const roleLabel = t(`role.${role}`);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDark(!dark);
  };

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <GraduationCap size={20} className="text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground">{t('app.name')}</h1>
              <p className="text-xs text-sidebar-foreground">{roleLabel}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${location.pathname === item.path ? 'sidebar-item-active' : ''}`}
              >
                {item.icon}
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4 space-y-2">
            <div className="px-3 py-2">
              <p className="text-xs text-sidebar-foreground truncate">{user?.email}</p>
            </div>
            <button onClick={handleSignOut} className="sidebar-item w-full text-destructive hover:text-destructive">
              <LogOut size={18} />
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-6">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLang} title={i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}>
              <Globe size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleDark}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
