-- Harden tenant isolation. All tenant-owned data must be scoped to the
-- authenticated user's owned/member workspaces.

CREATE OR REPLACE FUNCTION my_workspace_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM workspaces WHERE owner_id = auth.uid()
  UNION
  SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_access_workspace(p_workspace_id UUID)
RETURNS BOOLEAN AS $$
  SELECT p_workspace_id IN (SELECT my_workspace_ids());
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_access_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM events
    WHERE id = p_event_id
      AND can_access_workspace(workspace_id)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION can_access_group(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM groups
    WHERE id = p_group_id
      AND can_access_workspace(workspace_id)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

DROP POLICY IF EXISTS groups_select ON groups;
DROP POLICY IF EXISTS groups_write ON groups;
CREATE POLICY groups_select ON groups FOR SELECT
  USING (can_access_workspace(workspace_id));
CREATE POLICY groups_write ON groups FOR ALL
  USING (is_operational_role() AND can_access_workspace(workspace_id))
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));

DROP POLICY IF EXISTS events_select ON events;
DROP POLICY IF EXISTS events_insert ON events;
DROP POLICY IF EXISTS events_update ON events;
DROP POLICY IF EXISTS events_delete ON events;
CREATE POLICY events_select ON events FOR SELECT
  USING (can_access_workspace(workspace_id));
CREATE POLICY events_insert ON events FOR INSERT
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));
CREATE POLICY events_update ON events FOR UPDATE
  USING (is_operational_role() AND can_access_workspace(workspace_id))
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));
CREATE POLICY events_delete ON events FOR DELETE
  USING (is_operational_role() AND can_access_workspace(workspace_id));

DROP POLICY IF EXISTS members_select ON members;
DROP POLICY IF EXISTS members_write ON members;
CREATE POLICY members_select ON members FOR SELECT
  USING (can_access_workspace(workspace_id));
CREATE POLICY members_write ON members FOR ALL
  USING (is_operational_role() AND can_access_workspace(workspace_id))
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));

DROP POLICY IF EXISTS group_members_select ON group_members;
DROP POLICY IF EXISTS group_members_write ON group_members;
CREATE POLICY group_members_select ON group_members FOR SELECT
  USING (can_access_group(group_id));
CREATE POLICY group_members_write ON group_members FOR ALL
  USING (is_operational_role() AND can_access_group(group_id))
  WITH CHECK (is_operational_role() AND can_access_group(group_id));

DROP POLICY IF EXISTS event_groups_select ON event_groups;
DROP POLICY IF EXISTS event_groups_write ON event_groups;
CREATE POLICY event_groups_select ON event_groups FOR SELECT
  USING (can_access_event(event_id));
CREATE POLICY event_groups_write ON event_groups FOR ALL
  USING (is_operational_role() AND can_access_event(event_id))
  WITH CHECK (is_operational_role() AND can_access_event(event_id));

DROP POLICY IF EXISTS event_checklists_select ON event_checklists;
DROP POLICY IF EXISTS event_checklists_write ON event_checklists;
CREATE POLICY event_checklists_select ON event_checklists FOR SELECT
  USING (can_access_event(event_id));
CREATE POLICY event_checklists_write ON event_checklists FOR ALL
  USING (is_operational_role() AND can_access_event(event_id))
  WITH CHECK (is_operational_role() AND can_access_event(event_id));

DROP POLICY IF EXISTS timetable_entries_select ON timetable_entries;
DROP POLICY IF EXISTS timetable_entries_write ON timetable_entries;
CREATE POLICY timetable_entries_select ON timetable_entries FOR SELECT
  USING (can_access_event(event_id));
CREATE POLICY timetable_entries_write ON timetable_entries FOR ALL
  USING (is_operational_role() AND can_access_event(event_id))
  WITH CHECK (is_operational_role() AND can_access_event(event_id));

DROP POLICY IF EXISTS privilege_records_select ON privilege_records;
DROP POLICY IF EXISTS privilege_records_write ON privilege_records;
CREATE POLICY privilege_records_select ON privilege_records FOR SELECT
  USING (can_access_event(event_id));
CREATE POLICY privilege_records_write ON privilege_records FOR ALL
  USING (is_operational_role() AND can_access_event(event_id))
  WITH CHECK (is_operational_role() AND can_access_event(event_id));

DROP POLICY IF EXISTS privilege_types_select ON privilege_types;
DROP POLICY IF EXISTS privilege_types_write ON privilege_types;
CREATE POLICY privilege_types_select ON privilege_types FOR SELECT
  USING (can_access_workspace(workspace_id));
CREATE POLICY privilege_types_write ON privilege_types FOR ALL
  USING (is_owner_or_admin() AND can_access_workspace(workspace_id))
  WITH CHECK (is_owner_or_admin() AND can_access_workspace(workspace_id));

DROP POLICY IF EXISTS settlement_rates_select ON settlement_rates;
DROP POLICY IF EXISTS settlement_rates_write ON settlement_rates;
CREATE POLICY settlement_rates_select ON settlement_rates FOR SELECT
  USING (can_manage_settlement() AND can_access_workspace(workspace_id));
CREATE POLICY settlement_rates_write ON settlement_rates FOR ALL
  USING (can_manage_settlement() AND can_access_workspace(workspace_id))
  WITH CHECK (can_manage_settlement() AND can_access_workspace(workspace_id));

DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_write ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT
  USING (is_operational_role() AND can_access_workspace(workspace_id));
CREATE POLICY tasks_write ON tasks FOR ALL
  USING (is_operational_role() AND can_access_workspace(workspace_id))
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));

DROP POLICY IF EXISTS notices_select ON notices;
DROP POLICY IF EXISTS notices_insert ON notices;
DROP POLICY IF EXISTS notices_update ON notices;
DROP POLICY IF EXISTS notices_delete ON notices;
CREATE POLICY notices_select ON notices FOR SELECT
  USING (can_access_workspace(workspace_id));
CREATE POLICY notices_insert ON notices FOR INSERT
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));
CREATE POLICY notices_update ON notices FOR UPDATE
  USING (is_operational_role() AND can_access_workspace(workspace_id))
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));
CREATE POLICY notices_delete ON notices FOR DELETE
  USING (is_operational_role() AND can_access_workspace(workspace_id));

DROP POLICY IF EXISTS checklist_templates_select ON checklist_templates;
DROP POLICY IF EXISTS checklist_templates_write ON checklist_templates;
CREATE POLICY checklist_templates_select ON checklist_templates FOR SELECT
  USING (can_access_workspace(workspace_id));
CREATE POLICY checklist_templates_write ON checklist_templates FOR ALL
  USING (is_operational_role() AND can_access_workspace(workspace_id))
  WITH CHECK (is_operational_role() AND can_access_workspace(workspace_id));

