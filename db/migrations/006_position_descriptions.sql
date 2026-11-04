-- Fill in sample descriptions for the reference positions when they are empty.
-- Existing custom descriptions are never overwritten.

BEGIN;

UPDATE position
SET description = sample.description
FROM (
  VALUES
    ('Engineering Manager', 'Leads engineering teams, owns delivery planning, and coaches engineers.'),
    ('HR Specialist', 'Handles recruitment, onboarding, employee records, and HR policy support.'),
    ('Software Engineer', 'Builds and maintains product features, tests, and production systems.')
) AS sample(title, description)
WHERE lower(position.title) = lower(sample.title)
  AND position.deleted_at IS NULL
  AND (position.description IS NULL OR btrim(position.description) = '');

COMMIT;
