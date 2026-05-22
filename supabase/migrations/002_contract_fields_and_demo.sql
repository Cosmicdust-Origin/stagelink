-- Contract fields on group_members
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS contract_duration_months INT;

-- Ensure privilege types exist
DO $$
DECLARE
  v_admin_id          UUID;
  v_teukjeon_id       UUID;
  v_tongpan_id        UUID;
  v_group_id          UUID;
  v_event1_id         UUID;
  v_event2_id         UUID;
  v_event3_id         UUID;
  v_event4_id         UUID;
  v_hachi_id          UUID;
  v_shou_id           UUID;
  v_ami_id            UUID;
BEGIN
  SELECT id INTO v_admin_id FROM profiles WHERE role = 'admin' LIMIT 1;

  -- 특전권
  SELECT id INTO v_teukjeon_id FROM privilege_types WHERE name = '특전권' LIMIT 1;
  IF v_teukjeon_id IS NULL THEN
    INSERT INTO privilege_types (name, category, unit_price, is_active, created_by)
    VALUES ('특전권', 'on_site', 5000, true, v_admin_id)
    RETURNING id INTO v_teukjeon_id;
  END IF;

  -- 통판
  SELECT id INTO v_tongpan_id FROM privilege_types WHERE name = '통판' LIMIT 1;
  IF v_tongpan_id IS NULL THEN
    INSERT INTO privilege_types (name, category, unit_price, is_active, created_by)
    VALUES ('통판', 'mail_order', 5000, true, v_admin_id)
    RETURNING id INTO v_tongpan_id;
  END IF;

  -- First group
  SELECT id INTO v_group_id FROM groups LIMIT 1;

  -- 4 live events for May 2026
  INSERT INTO events (title, event_type, group_id, venue, start_at, end_at, created_by)
  VALUES ('단독 라이브 Vol.1', 'live', v_group_id, 'KBS홀',
          '2026-05-03 18:00:00+09', '2026-05-03 21:00:00+09', v_admin_id)
  RETURNING id INTO v_event1_id;

  INSERT INTO events (title, event_type, group_id, venue, start_at, end_at, created_by)
  VALUES ('스프링 라이브', 'live', v_group_id, '올림픽홀',
          '2026-05-10 17:00:00+09', '2026-05-10 20:30:00+09', v_admin_id)
  RETURNING id INTO v_event2_id;

  INSERT INTO events (title, event_type, group_id, venue, start_at, end_at, created_by)
  VALUES ('팬미팅 라이브', 'live', v_group_id, '세종문화회관',
          '2026-05-17 16:00:00+09', '2026-05-17 19:00:00+09', v_admin_id)
  RETURNING id INTO v_event3_id;

  INSERT INTO events (title, event_type, group_id, venue, start_at, end_at, created_by)
  VALUES ('5월 정기 공연', 'live', v_group_id, 'AX홀',
          '2026-05-24 18:30:00+09', '2026-05-24 21:30:00+09', v_admin_id)
  RETURNING id INTO v_event4_id;

  -- Member IDs
  SELECT id INTO v_hachi_id FROM profiles WHERE name = '하치' AND role = 'member' LIMIT 1;
  SELECT id INTO v_shou_id  FROM profiles WHERE name = '쇼우' AND role = 'member' LIMIT 1;
  SELECT id INTO v_ami_id   FROM profiles WHERE name = '아미' AND role = 'member' LIMIT 1;

  -- 특전권 records — 하치
  IF v_hachi_id IS NOT NULL THEN
    INSERT INTO privilege_records (event_id, member_id, privilege_type_id, quantity, recorded_by)
    VALUES
      (v_event1_id, v_hachi_id, v_teukjeon_id, 12, v_admin_id),
      (v_event2_id, v_hachi_id, v_teukjeon_id,  8, v_admin_id),
      (v_event3_id, v_hachi_id, v_teukjeon_id, 15, v_admin_id),
      (v_event4_id, v_hachi_id, v_teukjeon_id, 10, v_admin_id)
    ON CONFLICT (event_id, member_id, privilege_type_id) DO NOTHING;
  END IF;

  -- 특전권 records — 쇼우
  IF v_shou_id IS NOT NULL THEN
    INSERT INTO privilege_records (event_id, member_id, privilege_type_id, quantity, recorded_by)
    VALUES
      (v_event1_id, v_shou_id, v_teukjeon_id,  9, v_admin_id),
      (v_event2_id, v_shou_id, v_teukjeon_id, 14, v_admin_id),
      (v_event3_id, v_shou_id, v_teukjeon_id,  7, v_admin_id),
      (v_event4_id, v_shou_id, v_teukjeon_id, 11, v_admin_id)
    ON CONFLICT (event_id, member_id, privilege_type_id) DO NOTHING;
  END IF;

  -- 특전권 records — 아미
  IF v_ami_id IS NOT NULL THEN
    INSERT INTO privilege_records (event_id, member_id, privilege_type_id, quantity, recorded_by)
    VALUES
      (v_event1_id, v_ami_id, v_teukjeon_id, 11, v_admin_id),
      (v_event2_id, v_ami_id, v_teukjeon_id,  6, v_admin_id),
      (v_event3_id, v_ami_id, v_teukjeon_id, 13, v_admin_id),
      (v_event4_id, v_ami_id, v_teukjeon_id,  9, v_admin_id)
    ON CONFLICT (event_id, member_id, privilege_type_id) DO NOTHING;
  END IF;
END $$;
