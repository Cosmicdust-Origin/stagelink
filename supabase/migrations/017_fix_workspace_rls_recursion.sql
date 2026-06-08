-- Break recursive RLS references between workspaces and workspace_members.
-- Policies should call SECURITY DEFINER helpers instead of querying each other.

CREATE OR REPLACE FUNCTION public.owns_workspace(
  p_workspace_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspaces AS w
    WHERE w.id = p_workspace_id
      AND w.owner_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_workspace_member(
  p_workspace_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members AS wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = p_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.my_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT w.id
  FROM public.workspaces AS w
  WHERE w.owner_id = auth.uid()
  UNION
  SELECT wm.workspace_id
  FROM public.workspace_members AS wm
  WHERE wm.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_access_workspace(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_super_admin()
    OR public.owns_workspace(p_workspace_id)
    OR public.is_workspace_member(p_workspace_id);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS workspaces_owner ON public.workspaces;
DROP POLICY IF EXISTS workspaces_select ON public.workspaces;
DROP POLICY IF EXISTS workspaces_write ON public.workspaces;

CREATE POLICY workspaces_select ON public.workspaces FOR SELECT
  USING (public.can_access_workspace(id));

CREATE POLICY workspaces_write ON public.workspaces FOR ALL
  USING (public.is_super_admin() OR owner_id = auth.uid())
  WITH CHECK (public.is_super_admin() OR owner_id = auth.uid());

DROP POLICY IF EXISTS workspace_members_select ON public.workspace_members;
DROP POLICY IF EXISTS workspace_members_write ON public.workspace_members;

CREATE POLICY workspace_members_select ON public.workspace_members FOR SELECT
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
    OR public.owns_workspace(workspace_id)
  );

CREATE POLICY workspace_members_write ON public.workspace_members FOR ALL
  USING (public.is_super_admin() OR public.owns_workspace(workspace_id))
  WITH CHECK (public.is_super_admin() OR public.owns_workspace(workspace_id));
