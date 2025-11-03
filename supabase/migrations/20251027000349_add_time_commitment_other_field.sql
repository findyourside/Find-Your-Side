/*
  # Add time_commitment_other field to quiz_responses table

  1. Changes
    - Add `time_commitment_other` (text, nullable) - Custom time commitment description when "Other" is selected

  2. Important Notes
    - This field is optional and only populated when "Other" is selected for time commitment
    - Maximum length enforced at application level (50 characters)
    - Existing data is not affected as new column is nullable
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_responses' AND column_name = 'time_commitment_other'
  ) THEN
    ALTER TABLE quiz_responses ADD COLUMN time_commitment_other text;
  END IF;
END $$;
