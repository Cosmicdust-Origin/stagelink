-- ============================================================
-- 011_member_unit_price.sql
-- settlement_rates에 멤버별 장당 정산액(절대값) 컬럼 추가
-- rate 컬럼은 nullable + default 0 으로 완화 (기존 데이터 보존)
-- ============================================================

ALTER TABLE settlement_rates
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC;

-- rate를 nullable로 변경 (신규 방식은 unit_price만 사용)
ALTER TABLE settlement_rates
  ALTER COLUMN rate DROP NOT NULL;

ALTER TABLE settlement_rates
  ALTER COLUMN rate SET DEFAULT 0;
