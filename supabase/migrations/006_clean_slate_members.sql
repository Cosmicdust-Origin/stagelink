-- ============================================================
-- 006_clean_slate_members.sql
-- 실행 전 Supabase Dashboard → Authentication → Users 에서
-- 기존 테스트 계정을 모두 삭제하세요.
-- ============================================================

-- ─── 1. 기존 데이터 전체 초기화 ───────────────────────────────
TRUNCATE
  notice_attachments,
  task_attachments,
  event_attachments,
  notice_reads,
  notices,
  tasks,
  settlement_rates,
  privilege_records,
  event_checklists,
  timetable_entries,
  events,
  privilege_types,
  checklist_templates,
  group_managers,
  group_members,
  groups,
  workspace_members,
  workspaces
RESTART IDENTITY CASCADE;

DELETE FROM profiles;

-- ─── 2. profiles 에 username / email 컬럼 추가 ────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email    TEXT;

-- 나중에 UNIQUE 제약을 추가하되, 기존 NULL 허용 기간 동안은 partial unique
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON profiles (lower(username))
  WHERE username IS NOT NULL;

-- ─── 3. profiles 역할 제약 변경 (admin | manager 만 허용) ─────
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'manager'));

-- ─── 4. handle_new_user 트리거 업데이트 ───────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'manager'),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ─── 5. username 으로 이메일 조회 RPC (로그인용) ──────────────
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT AS $$
  SELECT email FROM profiles WHERE lower(username) = lower(p_username);
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

GRANT EXECUTE ON FUNCTION get_email_by_username(TEXT) TO anon, authenticated;

-- ─── 6. 독립 멤버(아티스트) 테이블 생성 ─────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_select ON members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY members_write ON members
  FOR ALL
  USING  (get_my_role() IN ('admin', 'manager'))
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

-- ─── 7. group_members: user_id → member_id (references members) ─
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_user_id_key;
ALTER TABLE group_members RENAME COLUMN user_id TO member_id;

ALTER TABLE group_members
  ADD CONSTRAINT group_members_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE group_members
  ADD CONSTRAINT group_members_group_id_member_id_key
  UNIQUE(group_id, member_id);

-- ─── 8. privilege_records.member_id → references members ──────
ALTER TABLE privilege_records DROP CONSTRAINT IF EXISTS privilege_records_member_id_fkey;
ALTER TABLE privilege_records
  ADD CONSTRAINT privilege_records_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- ─── 9. settlement_rates.member_id → references members ───────
ALTER TABLE settlement_rates DROP CONSTRAINT IF EXISTS settlement_rates_member_id_fkey;
ALTER TABLE settlement_rates
  ADD CONSTRAINT settlement_rates_member_id_fkey
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- ─── 10. RLS 정책 단순화 (그룹 멤버가 더 이상 auth 계정이 아님) ─
DROP POLICY IF EXISTS group_members_select     ON group_members;
DROP POLICY IF EXISTS group_members_admin_write ON group_members;

CREATE POLICY group_members_select ON group_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY group_members_write ON group_members
  FOR ALL
  USING  (get_my_role() IN ('admin', 'manager'))
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

-- events select 단순화 (그룹 멤버 user_id 조인 제거)
DROP POLICY IF EXISTS events_select ON events;
CREATE POLICY events_select ON events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- notices select 단순화
DROP POLICY IF EXISTS notices_select ON notices;
CREATE POLICY notices_select ON notices
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- privilege_records select 단순화
DROP POLICY IF EXISTS privilege_records_select ON privilege_records;
CREATE POLICY privilege_records_select ON privilege_records
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- settlement_rates: admin + manager 모두 조회 가능 (정산 체크용)
DROP POLICY IF EXISTS settlement_rates_all ON settlement_rates;
CREATE POLICY settlement_rates_select ON settlement_rates
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY settlement_rates_write ON settlement_rates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ─── 11. members 테이블 인덱스 ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_members_workspace ON members(workspace_id);
