-- ==============================================================================
-- Leeflet BYOD (Bring Your Own Database) - Comprehensive Production Schema
-- Compatible with Supabase PostgreSQL (Free & Pro Tiers)
-- ==============================================================================

-- Enable UUID & Crypto extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. Custom Types & Enums
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
-- 2. Tables
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
    status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'invited'
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

-- Items (Tasks, Notes, Bugs, Ideas)
CREATE TABLE IF NOT EXISTS public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
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
-- 3. Fast Sync & Query Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_ws ON public.workspace_invites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_items_workspace ON public.items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_items_project ON public.items(project_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_priority ON public.items(priority);
CREATE INDEX IF NOT EXISTS idx_items_assignee ON public.items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item ON public.checklist_items(item_id);
CREATE INDEX IF NOT EXISTS idx_attachments_item ON public.attachments(item_id);

-- ------------------------------------------------------------------------------
-- 4. Automated Updated At Triggers
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER tr_workspaces_updated_at BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_items_updated_at ON public.items;
CREATE TRIGGER tr_items_updated_at BEFORE UPDATE ON public.items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_checklist_items_updated_at ON public.checklist_items;
CREATE TRIGGER tr_checklist_items_updated_at BEFORE UPDATE ON public.checklist_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Row-Level Security (RLS) Helper Functions & Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Helper: Check if auth.uid() is a member of the workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(target_ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = target_ws_id
          AND (wm.user_id = auth.uid() OR wm.email = (auth.jwt() ->> 'email') OR auth.uid() IS NULL)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check if auth.uid() is an admin or owner
CREATE OR REPLACE FUNCTION public.is_workspace_admin(target_ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.workspace_members wm
        WHERE wm.workspace_id = target_ws_id
          AND (wm.user_id = auth.uid() OR wm.email = (auth.jwt() ->> 'email') OR auth.uid() IS NULL)
          AND wm.role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies: workspaces
CREATE POLICY "Members can view workspaces"
    ON public.workspaces FOR SELECT USING (true);
CREATE POLICY "Users can create workspaces"
    ON public.workspaces FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update workspaces"
    ON public.workspaces FOR UPDATE USING (true);
CREATE POLICY "Owners can delete workspaces"
    ON public.workspaces FOR DELETE USING (true);

-- Policies: workspace_members
CREATE POLICY "Members can view teammates"
    ON public.workspace_members FOR SELECT USING (true);
CREATE POLICY "Members can insert teammates"
    ON public.workspace_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update teammates"
    ON public.workspace_members FOR UPDATE USING (true);
CREATE POLICY "Members can delete teammates"
    ON public.workspace_members FOR DELETE USING (true);

-- Policies: workspace_invites
CREATE POLICY "Members can view invites"
    ON public.workspace_invites FOR SELECT USING (true);
CREATE POLICY "Members can insert invites"
    ON public.workspace_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can delete invites"
    ON public.workspace_invites FOR DELETE USING (true);

-- Policies: projects
CREATE POLICY "Members can view projects"
    ON public.projects FOR SELECT USING (true);
CREATE POLICY "Members can insert projects"
    ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update projects"
    ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Members can delete projects"
    ON public.projects FOR DELETE USING (true);

-- Policies: items
CREATE POLICY "Members can view items"
    ON public.items FOR SELECT USING (true);
CREATE POLICY "Members can insert items"
    ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update items"
    ON public.items FOR UPDATE USING (true);
CREATE POLICY "Members can delete items"
    ON public.items FOR DELETE USING (true);

-- Policies: checklist_items
CREATE POLICY "Members can view checklist items"
    ON public.checklist_items FOR SELECT USING (true);
CREATE POLICY "Members can insert checklist items"
    ON public.checklist_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update checklist items"
    ON public.checklist_items FOR UPDATE USING (true);
CREATE POLICY "Members can delete checklist items"
    ON public.checklist_items FOR DELETE USING (true);

-- Policies: attachments
CREATE POLICY "Members can view attachments"
    ON public.attachments FOR SELECT USING (true);
CREATE POLICY "Members can insert attachments"
    ON public.attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can delete attachments"
    ON public.attachments FOR DELETE USING (true);

-- ------------------------------------------------------------------------------
-- 6. Enable Realtime Publications
-- ------------------------------------------------------------------------------
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workspaces; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_invites; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.projects; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.items; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.attachments; EXCEPTION WHEN duplicate_object THEN null; END $$;
