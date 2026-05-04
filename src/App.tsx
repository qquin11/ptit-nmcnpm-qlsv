import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTranslation } from "react-i18next";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageTeachers";
import ManageCourses from "./pages/admin/ManageCourses";
import ManageClasses from "./pages/admin/ManageClasses";
import ManageSemesters from "./pages/admin/ManageSemesters";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherGrades from "./pages/teacher/TeacherGrades";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentGrades from "./pages/student/StudentGrades";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}`} replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const RoleRedirect = () => {
  const { user, role, loading } = useAuth();
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role) return <Navigate to={`/${role}`} replace />;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-muted-foreground">{t('login.noRole')}</p>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RoleRedirect />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><ManageStudents /></ProtectedRoute>} />
            <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><ManageTeachers /></ProtectedRoute>} />
            <Route path="/admin/courses" element={<ProtectedRoute allowedRoles={['admin']}><ManageCourses /></ProtectedRoute>} />
            <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['admin']}><ManageClasses /></ProtectedRoute>} />
            <Route path="/admin/semesters" element={<ProtectedRoute allowedRoles={['admin']}><ManageSemesters /></ProtectedRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
            <Route path="/teacher/grades" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherGrades /></ProtectedRoute>} />

            {/* Student Routes */}
            <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student']}><StudentGrades /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
