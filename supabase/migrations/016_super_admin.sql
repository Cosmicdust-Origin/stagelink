ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'owner', 'staff', 'manager'));

CREATE TABLE IF NOT EXISTS public.master_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.master_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION can_access_workspace(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT is_super_admin() OR p_workspace_id IN (SELECT my_workspace_ids());
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_owner_or_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'admin', 'owner');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_operational_role()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'admin', 'owner', 'staff', 'manager');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION can_manage_settlement()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('super_admin', 'admin', 'owner');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS master_audit_logs_select ON public.master_audit_logs;
CREATE POLICY master_audit_logs_select ON public.master_audit_logs FOR SELECT
  USING (is_super_admin());

DROP POLICY IF EXISTS master_audit_logs_insert ON public.master_audit_logs;
CREATE POLICY master_audit_logs_insert ON public.master_audit_logs FOR INSERT
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS workspaces_owner ON public.workspaces;
DROP POLICY IF EXISTS workspaces_select ON public.workspaces;
DROP POLICY IF EXISTS workspaces_write ON public.workspaces;

CREATE POLICY workspaces_select ON public.workspaces FOR SELECT
  USING (
    is_super_admin()
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members
      WHERE workspace_id = workspaces.id AND user_id = auth.uid()
    )
  );

CREATE POLICY workspaces_write ON public.workspaces FOR ALL
  USING (is_super_admin() OR owner_id = auth.uid())
  WITH CHECK (is_super_admin() OR owner_id = auth.uid());
