
-- Add unique constraints needed for seed upserts
ALTER TABLE public.teachers ADD CONSTRAINT teachers_user_id_unique UNIQUE (user_id);
ALTER TABLE public.students ADD CONSTRAINT students_user_id_unique UNIQUE (user_id);
ALTER TABLE public.semesters ADD CONSTRAINT semesters_name_unique UNIQUE (name);
ALTER TABLE public.courses ADD CONSTRAINT courses_course_code_unique UNIQUE (course_code);
ALTER TABLE public.classes ADD CONSTRAINT classes_class_name_unique UNIQUE (class_name);
ALTER TABLE public.schedules ADD CONSTRAINT schedules_class_day_unique UNIQUE (class_id, day_of_week);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_class_student_unique UNIQUE (class_id, student_id);
