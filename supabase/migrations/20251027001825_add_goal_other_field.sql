/*
  # Add goal_other field to quiz_responses table

  1. Changes
    - Add `goal_other` (text, nullable) - Custom goal description when "Other" is selected

  2. Important Notes
    - This field is optional and only populated when "Other" is selected for goal
    - Maximum length enforced at application level (100 characters)
    - Existing data is not affected as new column is nullable
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_responses' AND column_name = 'goal_other'
  ) THEN
    ALTER TABLE quiz_responses ADD COLUMN goal_other text;
  END IF;
END $$;
