-- Reference data needed before leave requests can be created.
INSERT INTO leave_type (name, default_days, is_paid)
VALUES
  ('Vacation', 15, true),
  ('Sick', 10, true),
  ('Unpaid', 0, false)
ON CONFLICT (name) DO NOTHING;
