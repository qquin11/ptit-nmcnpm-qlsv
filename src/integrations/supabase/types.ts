// Hand-written to match supabase/migrations/20260504000000_init.sql.
// Regenerate after schema changes:
//   npx supabase gen types typescript --project-id <your-project-id> > src/integrations/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string };
type WithUpdated = Timestamps & { updated_at: string };

export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: { id: string; user_id: string; role: 'admin' | 'teacher' | 'student' } & Timestamps;
        Insert: { id?: string; user_id: string; role: 'admin' | 'teacher' | 'student'; created_at?: string };
        Update: Partial<{ id: string; user_id: string; role: 'admin' | 'teacher' | 'student'; created_at: string }>;
        Relationships: [];
      };
      profiles: {
        Row: { id: string; user_id: string; full_name: string; email: string | null; phone: string | null; avatar_url: string | null } & WithUpdated;
        Insert: { id?: string; user_id: string; full_name?: string; email?: string | null; phone?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      teachers: {
        Row: { id: string; user_id: string; teacher_code: string; full_name: string; department: string | null; phone: string | null } & Timestamps;
        Insert: { id?: string; user_id: string; teacher_code: string; full_name: string; department?: string | null; phone?: string | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['teachers']['Insert']>;
        Relationships: [];
      };
      classes: {
        Row: { id: string; class_name: string; major: string | null; homeroom_teacher_id: string | null } & Timestamps;
        Insert: { id?: string; class_name: string; major?: string | null; homeroom_teacher_id?: string | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
        Relationships: [
          { foreignKeyName: 'classes_homeroom_teacher_id_fkey'; columns: ['homeroom_teacher_id']; isOneToOne: false; referencedRelation: 'teachers'; referencedColumns: ['id'] },
        ];
      };
      students: {
        Row: { id: string; user_id: string; student_code: string; full_name: string; class_id: string | null; dob: string | null; department: string | null; phone: string | null } & Timestamps;
        Insert: { id?: string; user_id: string; student_code: string; full_name: string; class_id?: string | null; dob?: string | null; department?: string | null; phone?: string | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['students']['Insert']>;
        Relationships: [
          { foreignKeyName: 'students_class_id_fkey'; columns: ['class_id']; isOneToOne: false; referencedRelation: 'classes'; referencedColumns: ['id'] },
        ];
      };
      courses: {
        Row: { id: string; course_code: string; course_name: string; credits: number; department: string | null; teacher_id: string | null } & Timestamps;
        Insert: { id?: string; course_code: string; course_name: string; credits?: number; department?: string | null; teacher_id?: string | null; created_at?: string };
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
        Relationships: [
          { foreignKeyName: 'courses_teacher_id_fkey'; columns: ['teacher_id']; isOneToOne: false; referencedRelation: 'teachers'; referencedColumns: ['id'] },
        ];
      };
      semesters: {
        Row: { id: string; name: string; start_date: string; end_date: string } & Timestamps;
        Insert: { id?: string; name: string; start_date: string; end_date: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['semesters']['Insert']>;
        Relationships: [];
      };
      grades: {
        Row: { id: string; student_id: string; course_id: string; semester_id: string; midterm: number | null; final: number | null; total: number | null; letter: string | null } & WithUpdated;
        Insert: { id?: string; student_id: string; course_id: string; semester_id: string; midterm?: number | null; final?: number | null; total?: number | null; letter?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['grades']['Insert']>;
        Relationships: [
          { foreignKeyName: 'grades_student_id_fkey'; columns: ['student_id']; isOneToOne: false; referencedRelation: 'students'; referencedColumns: ['id'] },
          { foreignKeyName: 'grades_course_id_fkey'; columns: ['course_id']; isOneToOne: false; referencedRelation: 'courses'; referencedColumns: ['id'] },
          { foreignKeyName: 'grades_semester_id_fkey'; columns: ['semester_id']; isOneToOne: false; referencedRelation: 'semesters'; referencedColumns: ['id'] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: 'admin' | 'teacher' | 'student' };
        Returns: boolean;
      };
    };
    Enums: { app_role: 'admin' | 'teacher' | 'student' };
    CompositeTypes: { [_ in never]: never };
  };
};
