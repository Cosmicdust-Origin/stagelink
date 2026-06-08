ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT '오늘도 무대 뒤를 단단하게';

UPDATE public.workspaces
SET tagline = '오늘도 무대 뒤를 단단하게'
WHERE tagline IS NULL OR btrim(tagline) = '';
