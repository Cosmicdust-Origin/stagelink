-- Role hierarchy: admin > owner(대표) > staff(직원)
-- Legacy manager is kept as staff-level for backwards compatibility.

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'owner', 'staff', 'manager'));

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := COALESCE(NEW.raw_user_meta_data->>'role', 'staff');

  INSERT INTO profiles (id, name, role, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN requested_role IN ('admin', 'owner', 'staff', 'manager') THEN requested_role
      ELSE 'staff'
    END,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_owner_or_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('admin', 'owner');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_operational_role()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('admin', 'owner', 'staff', 'manager');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION can_manage_settlement()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() IN ('admin', 'owner');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS profiles_update ON profiles;
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS groups_admin_write ON groups;
DROP POLICY IF EXISTS groups_write ON groups;
CREATE POLICY groups_write ON groups FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS members_write ON members;
CREATE POLICY members_write ON members FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS group_members_admin_write ON group_members;
DROP POLICY IF EXISTS group_members_write ON group_members;
CREATE POLICY group_members_write ON group_members FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS group_managers_admin_write ON group_managers;
DROP POLICY IF EXISTS group_managers_write ON group_managers;
CREATE POLICY group_managers_write ON group_managers FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS event_groups_write ON event_groups;
CREATE POLICY event_groups_write ON event_groups FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS events_insert ON events;
DROP POLICY IF EXISTS events_update ON events;
DROP POLICY IF EXISTS events_delete ON events;
CREATE POLICY events_insert ON events FOR INSERT
  WITH CHECK (is_operational_role());
CREATE POLICY events_update ON events FOR UPDATE
  USING (is_operational_role())
  WITH CHECK (is_operational_role());
CREATE POLICY events_delete ON events FOR DELETE
  USING (is_operational_role());

DROP POLICY IF EXISTS event_attachments_write ON event_attachments;
CREATE POLICY event_attachments_write ON event_attachments FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS checklist_templates_admin_write ON checklist_templates;
DROP POLICY IF EXISTS checklist_templates_write ON checklist_templates;
CREATE POLICY checklist_templates_write ON checklist_templates FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS event_checklists_write ON event_checklists;
CREATE POLICY event_checklists_write ON event_checklists FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS timetable_entries_write ON timetable_entries;
CREATE POLICY timetable_entries_write ON timetable_entries FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS privilege_types_admin_write ON privilege_types;
DROP POLICY IF EXISTS privilege_types_write ON privilege_types;
CREATE POLICY privilege_types_write ON privilege_types FOR ALL
  USING (is_owner_or_admin())
  WITH CHECK (is_owner_or_admin());

DROP POLICY IF EXISTS privilege_records_insert ON privilege_records;
DROP POLICY IF EXISTS privilege_records_update ON privilege_records;
DROP POLICY IF EXISTS privilege_records_delete ON privilege_records;
DROP POLICY IF EXISTS privilege_records_write ON privilege_records;
CREATE POLICY privilege_records_write ON privilege_records FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS settlement_rates_all ON settlement_rates;
DROP POLICY IF EXISTS settlement_rates_select ON settlement_rates;
DROP POLICY IF EXISTS settlement_rates_write ON settlement_rates;
CREATE POLICY settlement_rates_select ON settlement_rates FOR SELECT
  USING (can_manage_settlement());
CREATE POLICY settlement_rates_write ON settlement_rates FOR ALL
  USING (can_manage_settlement())
  WITH CHECK (can_manage_settlement());

DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_write ON tasks;
CREATE POLICY tasks_select ON tasks FOR SELECT
  USING (is_operational_role());
CREATE POLICY tasks_write ON tasks FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS task_attachments_write ON task_attachments;
CREATE POLICY task_attachments_write ON task_attachments FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());

DROP POLICY IF EXISTS notices_insert ON notices;
DROP POLICY IF EXISTS notices_update ON notices;
DROP POLICY IF EXISTS notices_delete ON notices;
CREATE POLICY notices_insert ON notices FOR INSERT
  WITH CHECK (is_operational_role());
CREATE POLICY notices_update ON notices FOR UPDATE
  USING (is_owner_or_admin() OR author_id = auth.uid())
  WITH CHECK (is_owner_or_admin() OR author_id = auth.uid());
CREATE POLICY notices_delete ON notices FOR DELETE
  USING (is_operational_role());

DROP POLICY IF EXISTS notice_attachments_write ON notice_attachments;
CREATE POLICY notice_attachments_write ON notice_attachments FOR ALL
  USING (is_operational_role())
  WITH CHECK (is_operational_role());
