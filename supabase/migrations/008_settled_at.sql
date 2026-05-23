-- ============================================================
-- 008_settled_at.sql
-- privilege_records에 정산 완료 시점 기록 컬럼 추가
-- settled_at이 NULL이면 미정산, 값이 있으면 정산 완료
-- ============================================================

ALTER TABLE privilege_records
  ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;
