-- Reference data needed before leave requests can be created.
INSERT INTO leave_type (name, default_days, is_paid)
VALUES
  ('Vacation', 15, true),
  ('Sick', 10, true),
  ('Unpaid', 0, false)
ON CONFLICT (name) DO NOTHING;

-- Sample departments. Existing departments (including soft-deleted ones) are
-- left untouched so custom descriptions are not overwritten.
INSERT INTO department (name, description)
SELECT sample.name, sample.description
FROM (
  VALUES
    ('Engineering', 'Builds and maintains the company''s products, platforms, and technical infrastructure.'),
    ('Human Resources', 'Supports recruitment, onboarding, employee records, and HR policy.'),
    ('Operations', 'Keeps day-to-day business processes running smoothly across teams and locations.')
) AS sample(name, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM department d
  WHERE lower(d.name) = lower(sample.name)
);

-- Sample positions. Existing positions are left untouched so custom
-- descriptions are not overwritten.
INSERT INTO position (title, description)
SELECT sample.title, sample.description
FROM (
  VALUES
    ('Engineering Manager', 'Leads engineering teams, owns delivery planning, and coaches engineers.'),
    ('HR Specialist', 'Handles recruitment, onboarding, employee records, and HR policy support.'),
    ('Software Engineer', 'Builds and maintains product features, tests, and production systems.')
) AS sample(title, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM position p
  WHERE lower(p.title) = lower(sample.title)
);
