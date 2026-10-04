-- ParkEase migration: realistic vehicle-based pricing + bike/scooter slots
-- Safe to run multiple times. Never drops tables or deletes existing rows.
-- Does not touch users, vehicles, or bookings.

BEGIN;

-- 1. Fix pricing per vehicle type on EXISTING slots (UPDATE only, no data loss)
UPDATE slots SET price_per_hour = 30 WHERE vehicle_type = 'car';
UPDATE slots SET price_per_hour = 15 WHERE vehicle_type = 'bike';
UPDATE slots SET price_per_hour = 15 WHERE vehicle_type = 'scooter';

-- 2. Add bike/scooter slots for any lot that doesn't have them yet.
--    Idempotent: only inserts if that lot currently has zero slots of
--    that type, so re-running this script is always safe.
DO $$
DECLARE
  lot_record RECORD;
  i INT;
  bike_count INT;
  scooter_count INT;
BEGIN
  FOR lot_record IN SELECT id FROM lots LOOP
    SELECT COUNT(*) INTO bike_count FROM slots WHERE lot_id = lot_record.id AND vehicle_type = 'bike';
    IF bike_count = 0 THEN
      FOR i IN 1..10 LOOP
        INSERT INTO slots (lot_id, slot_number, status, vehicle_type, price_per_hour)
        VALUES (lot_record.id, 'B' || i, 'available', 'bike', 15);
      END LOOP;
    END IF;

    SELECT COUNT(*) INTO scooter_count FROM slots WHERE lot_id = lot_record.id AND vehicle_type = 'scooter';
    IF scooter_count = 0 THEN
      FOR i IN 1..10 LOOP
        INSERT INTO slots (lot_id, slot_number, status, vehicle_type, price_per_hour)
        VALUES (lot_record.id, 'S' || i, 'available', 'scooter', 15);
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 3. Keep lots.total_slots in sync with the ACTUAL number of slots per lot
--    (this is what fixes "Total Capacity" mismatches — safe UPDATE only).
UPDATE lots l
SET total_slots = (SELECT COUNT(*) FROM slots s WHERE s.lot_id = l.id);

COMMIT;
