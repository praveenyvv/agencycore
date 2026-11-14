-- ============================================================================
-- AgencyCore: Agency Operations & Project Lifecycle Management Hub
-- Database Schema, Immutability Triggers & Row-Level Security (RBAC)
-- Target: PostgreSQL 15+ / Supabase
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUMS
-- ============================================================================
CREATE TYPE public.user_role AS ENUM ('admin', 'pm', 'member', 'client');

CREATE TYPE public.project_type AS ENUM (
  'Website',
  'Web App',
  'Mobile App',
  'Digital Marketing'
);

CREATE TYPE public.project_status AS ENUM (
  'Intake',
  'Scoping',
  'In Execution',
  'QA & Handover',
  'Completed/Archived',
  'Maintenance'
);

CREATE TYPE public.asset_folder_category AS ENUM (
  'Brand Assets & Logos',
  'Raw Images & Media',
  'Content & Copy',
  'Design Files / Wireframes',
  'Contracts & Docs'
);

CREATE TYPE public.task_status AS ENUM (
  'Backlog',
  'To Do',
  'In Progress',
  'Internal Review',
  'Done'
);

CREATE TYPE public.task_priority AS ENUM (
  'Low',
  'Medium',
  'High',
  'Critical'
);

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- 2.1 Users (mirrors auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_type public.project_type NOT NULL,
  status public.project_status NOT NULL DEFAULT 'Intake',
  start_date DATE NOT NULL,
  target_end_date DATE NOT NULL,
  actual_end_date DATE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Project Memberships (scopes members & clients to specific projects)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_role public.user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

-- 2.4 Project Requirements (Tab 1: Overview & Scope)
CREATE TABLE public.project_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  scope_summary TEXT NOT NULL DEFAULT '',
  deliverables_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  out_of_scope_notes TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 Project Assets (Tab 2: Asset & File Repository)
CREATE TABLE public.project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_category public.asset_folder_category NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  version_tag TEXT NOT NULL DEFAULT 'v1.0',
  client_approved BOOLEAN NOT NULL DEFAULT FALSE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.6 Encrypted Credential Vault (Tab 3)
CREATE TABLE public.project_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  login_url TEXT,
  username TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL, -- AES-256-GCM ciphertext (base64)
  iv TEXT NOT NULL,               -- AES-256-GCM initialization vector (base64)
  auth_tag TEXT NOT NULL,         -- AES-256-GCM authentication tag (base64)
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Tasks (Tab 4: Execution & Task Board)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status public.task_status NOT NULL DEFAULT 'Backlog',
  priority public.task_priority NOT NULL DEFAULT 'Medium',
  start_date DATE,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  is_delayed BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_by_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  linked_deliverable TEXT,
  deliverable_url TEXT, -- GitHub PR, Figma, Campaign URL for Tab 5 accountability
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.8 Immutable Activity & Audit Logs (Tab 6)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action_type TEXT NOT NULL, -- e.g. SCOPE_UPDATED, CREDENTIAL_REVEALED, TASK_STATUS_CHANGED, CLIENT_SIGN_OFF, PROJECT_ARCHIVED
  entity_type TEXT NOT NULL, -- e.g. project, requirement, asset, credential, task
  entity_id UUID,
  change_summary TEXT NOT NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_type ON public.projects(project_type);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_project_assets_project ON public.project_assets(project_id, folder_category);
CREATE INDEX idx_project_credentials_project ON public.project_credentials(project_id);
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date) WHERE status <> 'Done';
CREATE INDEX idx_activity_logs_project_created ON public.activity_logs(project_id, created_at DESC);

-- ============================================================================
-- 4. TRIGGERS & INVARIANTS
-- ============================================================================

-- 4.1 Immutable Audit Log Enforcement (No UPDATE or DELETE allowed)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'activity_logs is immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_activity_logs
  BEFORE UPDATE OR DELETE ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 4.2 Project Archival Lock Enforcement
CREATE OR REPLACE FUNCTION public.enforce_project_archive_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
  v_archived BOOLEAN;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);
  SELECT is_archived INTO v_archived FROM public.projects WHERE id = v_project_id;

  IF v_archived IS TRUE THEN
    RAISE EXCEPTION 'Project % is archived (Read-Only). An Admin must unlock it before modifying records.', v_project_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_archive_lock_requirements
  BEFORE INSERT OR UPDATE OR DELETE ON public.project_requirements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_archive_lock();

CREATE TRIGGER trg_archive_lock_assets
  BEFORE INSERT OR UPDATE OR DELETE ON public.project_assets
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_archive_lock();

CREATE TRIGGER trg_archive_lock_credentials
  BEFORE INSERT OR UPDATE OR DELETE ON public.project_credentials
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_archive_lock();

CREATE TRIGGER trg_archive_lock_tasks
  BEFORE INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_archive_lock();

-- 4.3 Automated Task Delay & Completion Timestamp Maintenance
CREATE OR REPLACE FUNCTION public.maintain_task_state()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();

  IF NEW.status = 'Done' AND (OLD.status IS DISTINCT FROM 'Done') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, NOW());
    NEW.is_delayed := (NEW.completed_at::date > NEW.due_date);
  ELSIF NEW.status <> 'Done' THEN
    NEW.completed_at := NULL;
    NEW.is_delayed := (CURRENT_DATE > NEW.due_date);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintain_task_state
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.maintain_task_state();

-- ============================================================================
-- 5. RBAC HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_internal_staff()
RETURNS BOOLEAN AS $$
  SELECT public.current_user_role() IN ('admin', 'pm', 'member');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 6. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Users
CREATE POLICY "Users: internal staff can view all, clients view self"
  ON public.users FOR SELECT
  USING (public.is_internal_staff() OR id = auth.uid());

CREATE POLICY "Users: admin can manage all users"
  ON public.users FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 6.2 Projects
CREATE POLICY "Projects: admin and pm view all; member and client view assigned"
  ON public.projects FOR SELECT
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR public.is_project_member(id)
  );

CREATE POLICY "Projects: admin and pm can create"
  ON public.projects FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'pm'));

CREATE POLICY "Projects: admin can update all; pm can update non-archived"
  ON public.projects FOR UPDATE
  USING (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'pm' AND is_archived = FALSE)
  )
  WITH CHECK (
    public.current_user_role() = 'admin'
    OR (public.current_user_role() = 'pm' AND is_archived = FALSE)
  );

-- 6.3 Project Members
CREATE POLICY "Project members: visible to internal staff and assigned clients"
  ON public.project_members FOR SELECT
  USING (public.is_internal_staff() OR user_id = auth.uid());

CREATE POLICY "Project members: admin and pm manage"
  ON public.project_members FOR ALL
  USING (public.current_user_role() IN ('admin', 'pm'))
  WITH CHECK (public.current_user_role() IN ('admin', 'pm'));

-- 6.4 Project Requirements
CREATE POLICY "Requirements: visible to admin, pm, and assigned users"
  ON public.project_requirements FOR SELECT
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR public.is_project_member(project_id)
  );

CREATE POLICY "Requirements: admin and pm can write"
  ON public.project_requirements FOR ALL
  USING (public.current_user_role() IN ('admin', 'pm'))
  WITH CHECK (public.current_user_role() IN ('admin', 'pm'));

-- 6.5 Project Assets
CREATE POLICY "Assets: internal staff see all assigned; clients see approved only"
  ON public.project_assets FOR SELECT
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR (public.current_user_role() = 'member' AND public.is_project_member(project_id))
    OR (public.current_user_role() = 'client' AND public.is_project_member(project_id) AND client_approved = TRUE)
  );

CREATE POLICY "Assets: internal staff can upload/manage"
  ON public.project_assets FOR ALL
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR (public.current_user_role() = 'member' AND public.is_project_member(project_id))
  )
  WITH CHECK (
    public.current_user_role() IN ('admin', 'pm')
    OR (public.current_user_role() = 'member' AND public.is_project_member(project_id))
  );

-- 6.6 Project Credentials (STRICT: Clients NEVER see credentials)
CREATE POLICY "Credentials: internal staff only (admin, pm, assigned members)"
  ON public.project_credentials FOR SELECT
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR (public.current_user_role() = 'member' AND public.is_project_member(project_id))
  );

CREATE POLICY "Credentials: admin and pm can write"
  ON public.project_credentials FOR ALL
  USING (public.current_user_role() IN ('admin', 'pm'))
  WITH CHECK (public.current_user_role() IN ('admin', 'pm'));

-- 6.7 Tasks
CREATE POLICY "Tasks: internal staff see all; clients see Done deliverables only"
  ON public.tasks FOR SELECT
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR (public.current_user_role() = 'member' AND public.is_project_member(project_id))
    OR (public.current_user_role() = 'client' AND public.is_project_member(project_id) AND status = 'Done')
  );

CREATE POLICY "Tasks: admin and pm full write; members update assigned project tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (public.current_user_role() IN ('admin', 'pm'));

CREATE POLICY "Tasks: admin, pm, and assigned members can update"
  ON public.tasks FOR UPDATE
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR (public.current_user_role() = 'member' AND public.is_project_member(project_id))
  );

CREATE POLICY "Tasks: admin and pm can delete"
  ON public.tasks FOR DELETE
  USING (public.current_user_role() IN ('admin', 'pm'));

-- 6.8 Activity Logs (Append-Only)
CREATE POLICY "Activity logs: internal staff see all; clients see sign-offs & milestones"
  ON public.activity_logs FOR SELECT
  USING (
    public.current_user_role() IN ('admin', 'pm')
    OR (public.current_user_role() = 'member' AND public.is_project_member(project_id))
    OR (
      public.current_user_role() = 'client'
      AND public.is_project_member(project_id)
      AND action_type IN ('CLIENT_SIGN_OFF', 'PROJECT_ARCHIVED', 'DELIVERABLE_APPROVED')
    )
  );

CREATE POLICY "Activity logs: internal staff append any; clients append sign-offs only"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    (public.is_internal_staff() AND user_id = auth.uid())
    OR (
      public.current_user_role() = 'client'
      AND public.is_project_member(project_id)
      AND user_id = auth.uid()
      AND action_type = 'CLIENT_SIGN_OFF'
    )
  );
