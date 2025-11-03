/*
  # Create idea_submissions table

  1. New Tables
    - `idea_submissions`
      - `id` (uuid, primary key) - Unique identifier for each submission
      - `email` (text) - User's email address
      - `business_idea` (text) - Detailed business idea description
      - `time_commitment` (text) - Weekly time commitment
      - `budget` (text) - Starting budget amount
      - `skills_experience` (text) - User's relevant skills and experience
      - `created_at` (timestamptz) - Timestamp of submission

  2. Security
    - Enable RLS on `idea_submissions` table
    - Add policy for inserting submissions (allow anyone to submit)
    - Add policy for authenticated users to read their own submissions

  3. Important Notes
    - This table stores business idea submissions for personalized playbook generation
    - Email is not unique as users can submit multiple ideas
    - All fields use NOT NULL constraints to ensure data completeness
*/

CREATE TABLE IF NOT EXISTS idea_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  business_idea text NOT NULL,
  time_commitment text NOT NULL,
  budget text NOT NULL,
  skills_experience text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE idea_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert idea submissions"
  ON idea_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read their own submissions"
  ON idea_submissions
  FOR SELECT
  TO anon
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');
