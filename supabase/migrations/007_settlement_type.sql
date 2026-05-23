-- ============================================================
-- 007_settlement_type.sql
-- 특전별 정산 방식: 비율(rate) vs 금액(fixed) 선택 가능
-- 금액 방식은 unit_price가 곧 정산 금액 (별도 비율 불필요)
-- ============================================================

ALTER TABLE privilege_types
  ADD COLUMN IF NOT EXISTS settlement_type TEXT NOT NULL DEFAULT 'rate'
  CHECK (settlement_type IN ('rate', 'fixed'));
