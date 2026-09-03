-- Migration: Rename project_components -> project_modules and items.component_id -> items.module_id
-- Safe, non-destructive migration script for live Supabase database

BEGIN;

-- 1. Rename table if old name exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'project_components'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'project_modules'
  ) THEN
    ALTER TABLE public.project_components RENAME TO project_modules;
  END IF;
END $$;

-- 2. Rename constraint if it exists under old name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_project_component_name'
  ) THEN
    ALTER TABLE public.project_modules RENAME CONSTRAINT unique_project_component_name TO unique_project_module_name;
  END IF;
END $$;

-- 3. Rename or add column on items table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'component_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'module_id'
  ) THEN
    ALTER TABLE public.items RENAME COLUMN component_id TO module_id;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'items' AND column_name = 'module_id'
  ) THEN
    ALTER TABLE public.items ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.project_modules(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Rename or create indexes
ALTER INDEX IF EXISTS idx_project_components_ws RENAME TO idx_project_modules_ws;
ALTER INDEX IF EXISTS idx_project_components_project RENAME TO idx_project_modules_project;
ALTER INDEX IF EXISTS idx_items_component RENAME TO idx_items_module;

CREATE INDEX IF NOT EXISTS idx_project_modules_ws ON public.project_modules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_modules_project ON public.project_modules(project_id);
CREATE INDEX IF NOT EXISTS idx_items_module ON public.items(module_id);

-- 5. Rename/recreate updated_at trigger
DROP TRIGGER IF EXISTS tr_project_components_updated_at ON public.project_modules;
DROP TRIGGER IF EXISTS tr_project_modules_updated_at ON public.project_modules;

CREATE TRIGGER tr_project_modules_updated_at BEFORE UPDATE ON public.project_modules
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Enable RLS and setup policies
ALTER TABLE public.project_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on project_components" ON public.project_modules;
DROP POLICY IF EXISTS "Members can view project components" ON public.project_modules;
DROP POLICY IF EXISTS "Members can insert project components" ON public.project_modules;
DROP POLICY IF EXISTS "Members can update project components" ON public.project_modules;
DROP POLICY IF EXISTS "Members can delete project components" ON public.project_modules;
DROP POLICY IF EXISTS "project_components_select_policy" ON public.project_modules;
DROP POLICY IF EXISTS "project_components_insert_policy" ON public.project_modules;
DROP POLICY IF EXISTS "project_components_update_policy" ON public.project_modules;
DROP POLICY IF EXISTS "project_components_delete_policy" ON public.project_modules;

DROP POLICY IF EXISTS "project_modules_select_policy" ON public.project_modules;
DROP POLICY IF EXISTS "project_modules_insert_policy" ON public.project_modules;
DROP POLICY IF EXISTS "project_modules_update_policy" ON public.project_modules;
DROP POLICY IF EXISTS "project_modules_delete_policy" ON public.project_modules;

CREATE POLICY "project_modules_select_policy" ON public.project_modules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "project_modules_insert_policy" ON public.project_modules FOR INSERT TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL AND project_id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "project_modules_update_policy" ON public.project_modules FOR UPDATE TO anon, authenticated USING (workspace_id IS NOT NULL) WITH CHECK (workspace_id IS NOT NULL AND project_id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "project_modules_delete_policy" ON public.project_modules FOR DELETE TO anon, authenticated USING (workspace_id IS NOT NULL);

-- 7. Add to supabase_realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.project_modules;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

-- 8. Backward-compatible view for old queries / clients (enforcing querying user's RLS)
CREATE OR REPLACE VIEW public.project_components WITH (security_invoker = true) AS SELECT * FROM public.project_modules;

COMMIT;
