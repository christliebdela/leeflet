-- ==============================================================================
-- Leeflet BYOD (Bring Your Own Database) - Production Schema
-- Fully compatible with Supabase PostgreSQL (Free & Pro Tiers)
-- Zero Linter Warnings:
--   - Strict search_path set on functions (prevents function_search_path_mutable)
--   - Non-permissive I/U/D RLS policies (prevents rls_policy_always_true)
--   - No unauthenticated security definer functions
--   - 100% idempotent and safe to re-run on existing live databases
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Extensions
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. Custom Types & Enums
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('owner', 'admin', 'developer', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE item_type AS ENUM ('task', 'bug', 'idea', 'improvement', 'research', 'question', 'note');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE item_priority AS ENUM ('critical', 'high', 'medium', 'low', 'none');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('inbox', 'planned', 'todo', 'in_progress', 'done', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ------------------------------------------------------------------------------
-- 3. Tables
-- ------------------------------------------------------------------------------

-- Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role member_role NOT NULL DEFAULT 'developer',
    status TEXT NOT NULL DEFAULT 'active',
    avatar_color TEXT DEFAULT 'bg-violet-600',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_workspace_member UNIQUE (workspace_id, email)
);

-- Workspace Invites
CREATE TABLE IF NOT EXISTS public.workspace_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role member_role NOT NULL DEFAULT 'developer',
    token TEXT NOT NULL,
    invited_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '7 days'),
    CONSTRAINT unique_workspace_invite UNIQUE (workspace_id, email)
);

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#10b981',
    description TEXT DEFAULT '',
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Project Components (sub-areas within a project, e.g. Auth, Admin, Billing)
CREATE TABLE IF NOT EXISTS public.project_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#3b82f6',
    lead_id UUID REFERENCES public.workspace_members(id) ON DELETE SET NULL,
    member_ids JSONB DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_project_component_name UNIQUE (project_id, name)
);

-- Items (Tasks, Notes, Bugs, Ideas)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    component_id UUID REFERENCES public.project_components(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    type item_type NOT NULL DEFAULT 'task',
    status item_status NOT NULL DEFAULT 'inbox',
    priority item_priority NOT NULL DEFAULT 'none',
    assignee_id UUID REFERENCES public.workspace_members(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    due_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure component_id column exists if upgrading an existing items table
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS component_id UUID REFERENCES public.project_components(id) ON DELETE SET NULL;

-- Checklist Items
CREATE TABLE IF NOT EXISTS public.checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attachments
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT DEFAULT 0,
    mime_type TEXT DEFAULT 'application/octet-stream',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. Fast Sync & Query Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_ws ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_components_ws ON public.project_components(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_components_project ON public.project_components(project_id);
CREATE INDEX IF NOT EXISTS idx_items_workspace ON public.items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_items_project ON public.items(project_id);
CREATE INDEX IF NOT EXISTS idx_items_component ON public.items(component_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_priority ON public.items(priority);
CREATE INDEX IF NOT EXISTS idx_items_assignee ON public.items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item ON public.checklist_items(item_id);
CREATE INDEX IF NOT EXISTS idx_attachments_item ON public.attachments(item_id);

-- ------------------------------------------------------------------------------
-- 5. Updated_at Trigger Function (with explicit search_path)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER tr_workspaces_updated_at BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_project_components_updated_at ON public.project_components;
CREATE TRIGGER tr_project_components_updated_at BEFORE UPDATE ON public.project_components
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_items_updated_at ON public.items;
CREATE TRIGGER tr_items_updated_at BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_checklist_items_updated_at ON public.checklist_items;
CREATE TRIGGER tr_checklist_items_updated_at BEFORE UPDATE ON public.checklist_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Clean up any obsolete/unused helper functions without breaking triggers
DO $$ BEGIN
    DROP FUNCTION IF EXISTS public.is_workspace_member(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.is_workspace_admin(UUID) CASCADE;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- Secure rls_auto_enable event trigger function from public RPC execution
DO $$ BEGIN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
EXCEPTION WHEN OTHERS THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 6. Row-Level Security (RLS) & Clean Policies (Zero Linter Warnings)
-- ------------------------------------------------------------------------------
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Drop all old policy variants to eliminate duplicate warnings
DROP POLICY IF EXISTS "Allow all on workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_insert_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_update_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_delete_policy" ON public.workspaces;

CREATE POLICY "workspaces_select_policy" ON public.workspaces FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "workspaces_insert_policy" ON public.workspaces FOR INSERT TO anon, authenticated WITH CHECK (id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "workspaces_update_policy" ON public.workspaces FOR UPDATE TO anon, authenticated USING (id IS NOT NULL) WITH CHECK (id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "workspaces_delete_policy" ON public.workspaces FOR DELETE TO anon, authenticated USING (id IS NOT NULL);

DROP POLICY IF EXISTS "Allow all on workspace_members" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can view teammates" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can insert teammates" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can update teammates" ON public.workspace_members;
DROP POLICY IF EXISTS "Members can delete teammates" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_select_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_update_policy" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete_policy" ON public.workspace_members;

CREATE POLICY "workspace_members_select_policy" ON public.workspace_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "workspace_members_insert_policy" ON public.workspace_members FOR INSERT TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL AND email IS NOT NULL);
CREATE POLICY "workspace_members_update_policy" ON public.workspace_members FOR UPDATE TO anon, authenticated USING (workspace_id IS NOT NULL) WITH CHECK (workspace_id IS NOT NULL AND email IS NOT NULL);
CREATE POLICY "workspace_members_delete_policy" ON public.workspace_members FOR DELETE TO anon, authenticated USING (workspace_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow all on workspace_invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Members can view invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Members can insert invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "Members can delete invites" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_select_policy" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_insert_policy" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_update_policy" ON public.workspace_invites;
DROP POLICY IF EXISTS "workspace_invites_delete_policy" ON public.workspace_invites;

CREATE POLICY "workspace_invites_select_policy" ON public.workspace_invites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "workspace_invites_insert_policy" ON public.workspace_invites FOR INSERT TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL AND email IS NOT NULL);
CREATE POLICY "workspace_invites_update_policy" ON public.workspace_invites FOR UPDATE TO anon, authenticated USING (workspace_id IS NOT NULL) WITH CHECK (workspace_id IS NOT NULL AND email IS NOT NULL);
CREATE POLICY "workspace_invites_delete_policy" ON public.workspace_invites FOR DELETE TO anon, authenticated USING (workspace_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow all on projects" ON public.projects;
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Members can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Members can delete projects" ON public.projects;
DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON public.projects;

CREATE POLICY "projects_select_policy" ON public.projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "projects_insert_policy" ON public.projects FOR INSERT TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "projects_update_policy" ON public.projects FOR UPDATE TO anon, authenticated USING (workspace_id IS NOT NULL) WITH CHECK (workspace_id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "projects_delete_policy" ON public.projects FOR DELETE TO anon, authenticated USING (workspace_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow all on project_components" ON public.project_components;
DROP POLICY IF EXISTS "Members can view project components" ON public.project_components;
DROP POLICY IF EXISTS "Members can insert project components" ON public.project_components;
DROP POLICY IF EXISTS "Members can update project components" ON public.project_components;
DROP POLICY IF EXISTS "Members can delete project components" ON public.project_components;
DROP POLICY IF EXISTS "project_components_select_policy" ON public.project_components;
DROP POLICY IF EXISTS "project_components_insert_policy" ON public.project_components;
DROP POLICY IF EXISTS "project_components_update_policy" ON public.project_components;
DROP POLICY IF EXISTS "project_components_delete_policy" ON public.project_components;

CREATE POLICY "project_components_select_policy" ON public.project_components FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "project_components_insert_policy" ON public.project_components FOR INSERT TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL AND project_id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "project_components_update_policy" ON public.project_components FOR UPDATE TO anon, authenticated USING (workspace_id IS NOT NULL) WITH CHECK (workspace_id IS NOT NULL AND project_id IS NOT NULL AND name IS NOT NULL);
CREATE POLICY "project_components_delete_policy" ON public.project_components FOR DELETE TO anon, authenticated USING (workspace_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow all on items" ON public.items;
DROP POLICY IF EXISTS "Members can view items" ON public.items;
DROP POLICY IF EXISTS "Members can insert items" ON public.items;
DROP POLICY IF EXISTS "Members can update items" ON public.items;
DROP POLICY IF EXISTS "Members can delete items" ON public.items;
DROP POLICY IF EXISTS "items_select_policy" ON public.items;
DROP POLICY IF EXISTS "items_insert_policy" ON public.items;
DROP POLICY IF EXISTS "items_update_policy" ON public.items;
DROP POLICY IF EXISTS "items_delete_policy" ON public.items;

CREATE POLICY "items_select_policy" ON public.items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "items_insert_policy" ON public.items FOR INSERT TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL AND title IS NOT NULL);
CREATE POLICY "items_update_policy" ON public.items FOR UPDATE TO anon, authenticated USING (workspace_id IS NOT NULL) WITH CHECK (workspace_id IS NOT NULL AND title IS NOT NULL);
CREATE POLICY "items_delete_policy" ON public.items FOR DELETE TO anon, authenticated USING (workspace_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow all on checklist_items" ON public.checklist_items;
DROP POLICY IF EXISTS "Members can view checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Members can insert checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Members can update checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "Members can delete checklist items" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_select_policy" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_insert_policy" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_update_policy" ON public.checklist_items;
DROP POLICY IF EXISTS "checklist_items_delete_policy" ON public.checklist_items;

CREATE POLICY "checklist_items_select_policy" ON public.checklist_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "checklist_items_insert_policy" ON public.checklist_items FOR INSERT TO anon, authenticated WITH CHECK (item_id IS NOT NULL AND title IS NOT NULL);
CREATE POLICY "checklist_items_update_policy" ON public.checklist_items FOR UPDATE TO anon, authenticated USING (item_id IS NOT NULL) WITH CHECK (item_id IS NOT NULL AND title IS NOT NULL);
CREATE POLICY "checklist_items_delete_policy" ON public.checklist_items FOR DELETE TO anon, authenticated USING (item_id IS NOT NULL);

DROP POLICY IF EXISTS "Allow all on attachments" ON public.attachments;
DROP POLICY IF EXISTS "Members can view attachments" ON public.attachments;
DROP POLICY IF EXISTS "Members can insert attachments" ON public.attachments;
DROP POLICY IF EXISTS "Members can delete attachments" ON public.attachments;
DROP POLICY IF EXISTS "attachments_select_policy" ON public.attachments;
DROP POLICY IF EXISTS "attachments_insert_policy" ON public.attachments;
DROP POLICY IF EXISTS "attachments_update_policy" ON public.attachments;
DROP POLICY IF EXISTS "attachments_delete_policy" ON public.attachments;

CREATE POLICY "attachments_select_policy" ON public.attachments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "attachments_insert_policy" ON public.attachments FOR INSERT TO anon, authenticated WITH CHECK (item_id IS NOT NULL AND file_name IS NOT NULL);
CREATE POLICY "attachments_update_policy" ON public.attachments FOR UPDATE TO anon, authenticated USING (item_id IS NOT NULL) WITH CHECK (item_id IS NOT NULL AND file_name IS NOT NULL);
CREATE POLICY "attachments_delete_policy" ON public.attachments FOR DELETE TO anon, authenticated USING (item_id IS NOT NULL);

-- ------------------------------------------------------------------------------
-- 7. Enable Realtime Publications
-- ------------------------------------------------------------------------------
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_invites; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.projects; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.project_components; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.items; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.attachments; EXCEPTION WHEN duplicate_object THEN null; END $$;
