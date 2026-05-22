-- Workspace table (1 admin = 1 workspace)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT workspaces_owner_unique UNIQUE (owner_id)
);

-- Staff/manager multi-workspace membership
CREATE TABLE public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (workspace_id, user_id)
);

-- Tenant columns
ALTER TABLE public.groups        ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.events        ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.privilege_types   ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.settlement_rates  ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.tasks         ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.notices       ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
ALTER TABLE public.checklist_templates ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.workspaces       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspaces_owner ON public.workspaces
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY workspace_members_select ON public.workspace_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY workspace_members_write ON public.workspace_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- Update privilege_types_public view to expose workspace_id
CREATE OR REPLACE VIEW public.privilege_types_public AS
  SELECT id, name, category, is_active, created_at, workspace_id
  FROM public.privilege_types;

-- Indexes
CREATE INDEX idx_workspaces_owner      ON public.workspaces(owner_id);
CREATE INDEX idx_ws_members_workspace  ON public.workspace_members(workspace_id);
CREATE INDEX idx_ws_members_user       ON public.workspace_members(user_id);
CREATE INDEX idx_groups_workspace      ON public.groups(workspace_id);
CREATE INDEX idx_events_workspace      ON public.events(workspace_id);
CREATE INDEX idx_tasks_workspace       ON public.tasks(workspace_id);
CREATE INDEX idx_notices_workspace     ON public.notices(workspace_id);
CREATE INDEX idx_privilege_types_ws    ON public.privilege_types(workspace_id);
CREATE INDEX idx_settlement_rates_ws   ON public.settlement_rates(workspace_id);
