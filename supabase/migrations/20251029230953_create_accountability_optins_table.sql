/*
  # Create accountability opt-ins table

  1. New Tables
    - `accountability_optins`
      - `id` (uuid, primary key) - Unique identifier
      - `email` (text, not null) - User's email address
      - `business_name` (text, not null) - Name of the business idea
      - `day_1_task_title` (text, not null) - Title of Day 1 task
      - `day_1_task_description` (text, not null) - Description of Day 1 task
      - `day_1_time_estimate` (text, not null) - Time estimate for Day 1 task
      - `reminder_sent` (boolean, default false) - Whether reminder email has been sent
      - `reminder_sent_at` (timestamptz) - When the reminder was sent
      - `created_at` (timestamptz, default now()) - When opt-in was recorded

  2. Security
    - Enable RLS on `accountability_optins` table
    - Add policy for service role to manage all records (for edge function access)
*/

CREATE TABLE IF NOT EXISTS accountability_optins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  business_name text NOT NULL,
  day_1_task_title text NOT NULL,
  day_1_task_description text NOT NULL,
  day_1_time_estimate text NOT NULL,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accountability_optins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all accountability optins"
  ON accountability_optins
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);