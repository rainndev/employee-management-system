-- Fill in sample descriptions for the reference departments when they are
-- empty. Existing custom descriptions are never overwritten, and soft-deleted
-- departments are left untouched.

BEGIN;

UPDATE department
SET description = sample.description
FROM (
  VALUES
    ('Engineering', 'Builds and maintains the company''s products, platforms, and technical infrastructure.'),
    ('Human Resources', 'Supports recruitment, onboarding, employee records, and HR policy.'),
    ('Operations', 'Keeps day-to-day business processes running smoothly across teams and locations.')
) AS sample(name, description)
WHERE lower(department.name) = lower(sample.name)
  AND department.deleted_at IS NULL
  AND (department.description IS NULL OR btrim(department.description) = '');

COMMIT;
