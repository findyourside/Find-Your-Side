/*
  # Add "Other" fields to quiz_responses table

  1. Changes
    - Add `skills_other` (text, nullable) - Custom skills description when "Other" is selected
    - Add `interests_other` (text, nullable) - Custom interests description when "Other" is selected

  2. Important Notes
    - These fields are optional and only populated when "Other" is selected
    - Maximum length enforced at application level (200 characters)
    - Existing data is not affected as new columns are nullable
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_responses' AND column_name = 'skills_other'
  ) THEN
    ALTER TABLE quiz_responses ADD COLUMN skills_other text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_responses' AND column_name = 'interests_other'
  ) THEN
    ALTER TABLE quiz_responses ADD COLUMN interests_other text;
  END IF;
END $$;
