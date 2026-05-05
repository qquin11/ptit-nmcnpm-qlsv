-- Additional student fields: gender, address, status
ALTER TABLE public.students
  ADD COLUMN gender TEXT CHECK (gender IN ('M', 'F')),
  ADD COLUMN address TEXT,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'interrupted', 'terminated', 'graduated'));
