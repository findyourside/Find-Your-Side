/*
  # Create quiz_responses table

  1. New Tables
    - `quiz_responses`
      - `id` (uuid, primary key) - Unique identifier for each response
      - `email` (text) - User's email address
      - `skills` (text[]) - Array of selected skills
      - `time_commitment` (text) - Weekly time commitment
      - `budget` (text) - Upfront investment budget
      - `interests` (text[]) - Array of selected interests
      - `goal` (text) - Main business goal
      - `experience` (text) - Experience level
      - `created_at` (timestamptz) - Timestamp of response submission

  2. Security
    - Enable RLS on `quiz_responses` table
    - Add policy for inserting responses (allow anyone to submit)
    - Add policy for authenticated users to read their own responses

  3. Important Notes
    - This table stores quiz responses for business idea generation
    - Email is not unique as users can retake the quiz
    - All fields use NOT NULL constraints to ensure data completeness
*/

CREATE TABLE IF NOT EXISTS quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  skills text[] NOT NULL,
  time_commitment text NOT NULL,
  budget text NOT NULL,
  interests text[] NOT NULL,
  goal text NOT NULL,
  experience text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz responses"
  ON quiz_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read their own responses"
  ON quiz_responses
  FOR SELECT
  TO anon
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');
