-- ============================================================
-- 009_event_manager_text_timetable_endtime.sql
-- 현장 담당자: FK → 자유 텍스트 입력
-- 타임테이블: 종료 시간(end_time) 컬럼 추가
-- ============================================================

-- 현장 담당자 자유 텍스트 컬럼
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS on_site_manager TEXT;

-- 타임테이블 종료 시간
ALTER TABLE timetable_entries
  ADD COLUMN IF NOT EXISTS end_time TEXT;
