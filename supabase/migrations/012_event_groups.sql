-- ============================================================
-- 012_event_groups.sql
-- 이벤트-그룹 다대다 조인 테이블
-- 기존 events.group_id 데이터를 마이그레이션 후 column 유지
-- (settlement 등 기존 코드 호환성 위해 group_id는 남겨둠)
-- ============================================================

CREATE TABLE IF NOT EXISTS event_groups (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  UNIQUE(event_id, group_id)
);

ALTER TABLE event_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY event_groups_select ON event_groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY event_groups_write ON event_groups
  FOR ALL
  USING  (get_my_role() IN ('admin', 'manager'))
  WITH CHECK (get_my_role() IN ('admin', 'manager'));

-- 기존 events.group_id 데이터를 event_groups로 복사
INSERT INTO event_groups (event_id, group_id)
SELECT id, group_id FROM events WHERE group_id IS NOT NULL
ON CONFLICT DO NOTHING;
