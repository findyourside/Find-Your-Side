/*
  # Make idea_submissions fields nullable

  1. Changes
    - Make `budget` column nullable (idea form doesn't collect budget)
    - Make `skills_experience` column nullable (it's an optional field)

  2. Security
    - No changes to RLS policies
*/

DO $$
BEGIN
  ALTER TABLE idea_submissions ALTER COLUMN budget DROP NOT NULL;
  ALTER TABLE idea_submissions ALTER COLUMN skills_experience DROP NOT NULL;
END $$;
