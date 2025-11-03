/*
  # Create Feedback and Interest Tracking Tables

  ## Overview
  This migration creates tables to track user interest in extended features and collect
  product feedback for roadmap prioritization.

  ## New Tables

  ### `user_interests`
  Tracks when users express interest in extended playbooks or sign up for updates
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, required) - User's email address
  - `interest_type` (text, required) - Type: 'extended_playbook', 'newsletter', 'complete_satisfied'
  - `metadata` (jsonb, optional) - Additional context (e.g., user message)
  - `created_at` (timestamptz) - When interest was expressed
  - Indexes on email and interest_type for efficient querying

  ### `feature_feedback`
  Captures user feedback on desired features and improvements
  - `id` (uuid, primary key) - Unique identifier
  - `email` (text, optional) - User's email if provided
  - `selected_features` (text array) - List of features user selected
  - `custom_feedback` (text, optional) - Free-form text feedback
  - `created_at` (timestamptz) - When feedback was submitted
  - Index on created_at for temporal analysis

  ## Security
  1. Enable RLS on both tables
  2. Allow anonymous inserts (users may not be authenticated)
  3. Restrict selects to authenticated users only (for admin access)
  4. No updates or deletes allowed (maintain data integrity)

  ## Notes
  - Tables support anonymous submissions for friction-free data collection
  - Both tables are append-only to preserve all feedback
  - Designed for easy analysis and product roadmap prioritization
*/

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  interest_type text NOT NULL CHECK (interest_type IN ('extended_playbook', 'newsletter', 'complete_satisfied')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_interests_email ON user_interests(email);
CREATE INDEX IF NOT EXISTS idx_user_interests_type ON user_interests(interest_type);
CREATE INDEX IF NOT EXISTS idx_user_interests_created_at ON user_interests(created_at);

-- Create feature_feedback table
CREATE TABLE IF NOT EXISTS feature_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  selected_features text[] DEFAULT ARRAY[]::text[],
  custom_feedback text,
  created_at timestamptz DEFAULT now()
);

-- Create index for temporal analysis
CREATE INDEX IF NOT EXISTS idx_feature_feedback_created_at ON feature_feedback(created_at);

-- Enable RLS on both tables
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert their own feedback
CREATE POLICY "Anyone can submit interest"
  ON user_interests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can submit feedback"
  ON feature_feedback
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can submit interest"
  ON user_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can submit feedback"
  ON feature_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can view (for admin analysis)
CREATE POLICY "Authenticated users can view interests"
  ON user_interests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view feedback"
  ON feature_feedback
  FOR SELECT
  TO authenticated
  USING (true);