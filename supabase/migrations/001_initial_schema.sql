CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE event_type AS ENUM ('live', 'rehearsal', 'filming', 'meeting', 'other');
CREATE TYPE privilege_category AS ENUM ('on_site', 'event', 'mail_order', 'goods', 'other');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
  phone TEXT,
  joined_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  debut_date DATE,
  description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position TEXT,
  joined_at DATE DEFAULT CURRENT_DATE,
  UNIQUE(group_id, user_id)
);

CREATE TABLE group_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_type event_type NOT NULL DEFAULT 'live',
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  venue TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  memo TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  checked_by UUID REFERENCES profiles(id),
  checked_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0
);

CREATE TABLE timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  set_count INT,
  note TEXT,
  sort_order INT DEFAULT 0
);

CREATE TABLE privilege_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category privilege_category NOT NULL DEFAULT 'on_site',
  unit_price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE privilege_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  privilege_type_id UUID NOT NULL REFERENCES privilege_types(id),
  quantity INT NOT NULL DEFAULT 0,
  recorded_by UUID NOT NULL REFERENCES profiles(id),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id, privilege_type_id)
);

CREATE TABLE settlement_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  privilege_type_id UUID NOT NULL REFERENCES privilege_types(id),
  rate NUMERIC(5,4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  target_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notice_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(notice_id, user_id)
);

CREATE TABLE notice_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_my_role() = 'admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION is_manager_of(p_group_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_managers
    WHERE group_id = p_group_id AND user_id = auth.uid()
  ) OR is_admin();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE VIEW privilege_types_public AS
  SELECT id, name, category, is_active, created_at
  FROM privilege_types;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE privilege_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE privilege_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin() OR get_my_role() = 'manager');
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_admin()) WITH CHECK (id = auth.uid() OR is_admin());

CREATE POLICY groups_select ON groups FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY groups_admin_write ON groups FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY group_members_select ON group_members FOR SELECT USING (
  is_admin() OR get_my_role() = 'manager' OR user_id = auth.uid()
);
CREATE POLICY group_members_admin_write ON group_members FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY group_managers_select ON group_managers FOR SELECT USING (
  is_admin() OR get_my_role() = 'manager' OR user_id = auth.uid()
);
CREATE POLICY group_managers_admin_write ON group_managers FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY events_select ON events FOR SELECT USING (
  is_admin()
  OR get_my_role() = 'manager'
  OR group_id IS NULL
  OR EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = events.group_id AND group_members.user_id = auth.uid()
  )
);
CREATE POLICY events_insert ON events FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY events_update ON events FOR UPDATE USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY events_delete ON events FOR DELETE USING (is_admin());

CREATE POLICY event_attachments_select ON event_attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_attachments.event_id)
);
CREATE POLICY event_attachments_write ON event_attachments FOR ALL
  USING (get_my_role() IN ('admin', 'manager')) WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY checklist_templates_select ON checklist_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY checklist_templates_admin_write ON checklist_templates FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY event_checklists_select ON event_checklists FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = event_checklists.event_id)
);
CREATE POLICY event_checklists_write ON event_checklists FOR ALL
  USING (get_my_role() IN ('admin', 'manager')) WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY timetable_entries_select ON timetable_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM events WHERE events.id = timetable_entries.event_id)
);
CREATE POLICY timetable_entries_write ON timetable_entries FOR ALL
  USING (get_my_role() IN ('admin', 'manager')) WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY privilege_types_select ON privilege_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY privilege_types_admin_write ON privilege_types FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY privilege_records_select ON privilege_records FOR SELECT USING (
  is_admin() OR get_my_role() = 'manager' OR member_id = auth.uid()
);
CREATE POLICY privilege_records_insert ON privilege_records FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY privilege_records_update ON privilege_records FOR UPDATE USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY privilege_records_delete ON privilege_records FOR DELETE USING (is_admin());

CREATE POLICY settlement_rates_all ON settlement_rates FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY tasks_select ON tasks FOR SELECT USING (get_my_role() IN ('admin', 'manager'));
CREATE POLICY tasks_write ON tasks FOR ALL USING (get_my_role() IN ('admin', 'manager')) WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY task_attachments_select ON task_attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM tasks WHERE tasks.id = task_attachments.task_id)
);
CREATE POLICY task_attachments_write ON task_attachments FOR ALL
  USING (get_my_role() IN ('admin', 'manager')) WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE POLICY notices_select ON notices FOR SELECT USING (
  is_admin()
  OR target_group_id IS NULL
  OR get_my_role() = 'manager'
  OR EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = notices.target_group_id AND group_members.user_id = auth.uid()
  )
);
CREATE POLICY notices_insert ON notices FOR INSERT WITH CHECK (get_my_role() IN ('admin', 'manager'));
CREATE POLICY notices_update ON notices FOR UPDATE USING (is_admin() OR author_id = auth.uid());
CREATE POLICY notices_delete ON notices FOR DELETE USING (is_admin());

CREATE POLICY notice_reads_select ON notice_reads FOR SELECT USING (
  is_admin() OR get_my_role() = 'manager' OR user_id = auth.uid()
);
CREATE POLICY notice_reads_insert ON notice_reads FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY notice_attachments_select ON notice_attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM notices WHERE notices.id = notice_attachments.notice_id)
);
CREATE POLICY notice_attachments_write ON notice_attachments FOR ALL
  USING (get_my_role() IN ('admin', 'manager')) WITH CHECK (get_my_role() IN ('admin', 'manager'));

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_privilege_records_event ON privilege_records(event_id);
CREATE INDEX idx_privilege_records_member ON privilege_records(member_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_notices_created_at ON notices(created_at DESC);
