-- Merge '체키' privilege type into '특전권'
DO $$
DECLARE
  v_cheki_id     UUID;
  v_teukjeon_id  UUID;
BEGIN
  SELECT id INTO v_cheki_id    FROM privilege_types WHERE name = '체키'  LIMIT 1;
  SELECT id INTO v_teukjeon_id FROM privilege_types WHERE name = '특전권' LIMIT 1;

  IF v_cheki_id IS NULL THEN
    RAISE NOTICE '체키 type not found — nothing to do';
    RETURN;
  END IF;

  -- If '특전권' doesn't exist yet, just rename '체키'
  IF v_teukjeon_id IS NULL THEN
    UPDATE privilege_types SET name = '특전권' WHERE id = v_cheki_id;
    RAISE NOTICE 'Renamed 체키 → 특전권';
    RETURN;
  END IF;

  -- Merge privilege_records: upsert into 특전권, adding quantities where both exist
  INSERT INTO privilege_records (event_id, member_id, privilege_type_id, quantity, recorded_by)
  SELECT event_id, member_id, v_teukjeon_id, quantity, recorded_by
  FROM privilege_records
  WHERE privilege_type_id = v_cheki_id
  ON CONFLICT (event_id, member_id, privilege_type_id)
  DO UPDATE SET quantity = privilege_records.quantity + EXCLUDED.quantity;

  -- Remove 체키 records
  DELETE FROM privilege_records WHERE privilege_type_id = v_cheki_id;

  -- Remove 체키 settlement rates (특전권 rates will apply)
  DELETE FROM settlement_rates WHERE privilege_type_id = v_cheki_id;

  -- Deactivate 체키 type
  UPDATE privilege_types SET is_active = false WHERE id = v_cheki_id;

  RAISE NOTICE '체키 merged into 특전권 and deactivated';
END $$;
