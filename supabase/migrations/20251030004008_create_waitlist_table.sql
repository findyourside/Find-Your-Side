/*
  # Create Waitlist Table

  1. New Table
    - `waitlist`
      - `id` (uuid, primary key)
      - `email` (text, not null)
      - `features_interested` (text array, features user wants)
      - `urgency_level` (text, when they want it)
      - `joined_at` (timestamptz, when they signed up)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `waitlist` table
    - Allow public inserts (for waitlist signup)
    - Service role can read all data

  3. Notes
    - Captures interest from users who hit generation limits
    - Tracks which features they want and urgency level
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  features_interested text[] DEFAULT ARRAY[]::text[],
  urgency_level text CHECK (urgency_level IN ('immediate', '3months', 'updates')),
  joined_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert to waitlist"
  ON waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can read all waitlist entries"
  ON waitlist
  FOR SELECT
  TO service_role
  USING (true);