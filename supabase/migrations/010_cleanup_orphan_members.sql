-- ============================================================
-- 010_cleanup_orphan_members.sql
-- 그룹에도 속하지 않고 특전 기록도 없는 고아 members 레코드 정리
-- (그룹에서 삭제 시 members 레코드가 남던 버그로 생성된 것들)
-- ============================================================

DELETE FROM members
WHERE id NOT IN (
  SELECT DISTINCT member_id FROM group_members WHERE member_id IS NOT NULL
)
AND id NOT IN (
  SELECT DISTINCT member_id FROM privilege_records WHERE member_id IS NOT NULL
)
AND id NOT IN (
  SELECT DISTINCT member_id FROM settlement_rates WHERE member_id IS NOT NULL
);
