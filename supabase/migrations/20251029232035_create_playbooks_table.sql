/*
  # Create playbooks table for Day 1 nudge automation

  1. New Tables
    - `playbooks`
      - `id` (uuid, primary key) - Unique identifier
      - `user_email` (text, not null) - User's email address
      - `business_name` (text, not null) - Name of the business idea
      - `playbook_data` (jsonb, not null) - Full playbook JSON data
      - `day1_nudge_opted_in` (boolean, default false) - User opted in for Day 1 reminder
      - `day1_nudge_sent` (boolean, default false) - Whether Day 1 reminder was sent
      - `day1_nudge_sent_at` (timestamptz) - When the reminder was sent
      - `playbook_generated_at` (timestamptz, default now()) - When playbook was created
      - `created_at` (timestamptz, default now()) - Record creation timestamp

  2. Security
    - Enable RLS on `playbooks` table
    - Add policy for service role to manage all records (for edge function access)

  3. Indexes
    - Index on email for lookups
    - Index on day1_nudge_opted_in and day1_nudge_sent for cron job queries
*/

CREATE TABLE IF NOT EXISTS playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  business_name text NOT NULL,
  playbook_data jsonb NOT NULL,
  day1_nudge_opted_in boolean DEFAULT false,
  day1_nudge_sent boolean DEFAULT false,
  day1_nudge_sent_at timestamptz,
  playbook_generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playbooks_email ON playbooks(user_email);
CREATE INDEX IF NOT EXISTS idx_playbooks_nudge_status ON playbooks(day1_nudge_opted_in, day1_nudge_sent, playbook_generated_at);

ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage all playbooks"
  ON playbooks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);