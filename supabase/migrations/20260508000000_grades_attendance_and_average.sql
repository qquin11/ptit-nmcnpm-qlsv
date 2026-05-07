-- Add attendance column and rename total -> average on grades.
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS attendance NUMERIC(5,2);
ALTER TABLE public.grades RENAME COLUMN total TO average;

-- Replace trigger function: average = 10% attendance + 30% midterm + 60% final.
CREATE OR REPLACE FUNCTION public.calculate_total_grade()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.average = COALESCE(NEW.attendance, 0) * 0.1
              + COALESCE(NEW.midterm, 0) * 0.3
              + COALESCE(NEW.final, 0) * 0.6;
  RETURN NEW;
END;
$$;
