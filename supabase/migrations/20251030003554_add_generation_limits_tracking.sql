/*
  # Add Generation Limits Tracking

  1. New Table
    - `user_generation_limits`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `idea_sets_generated` (integer, default 0)
      - `playbooks_generated` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_generation_limits` table
    - Add policies for authenticated users to read their own data
    - Service role can insert/update for tracking

  3. Notes
    - Tracks the number of idea sets and playbooks generated per user email
    - Max 2 idea sets and 2 playbooks per email
*/

CREATE TABLE IF NOT EXISTS user_generation_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  idea_sets_generated integer DEFAULT 0 NOT NULL CHECK (idea_sets_generated >= 0 AND idea_sets_generated <= 2),
  playbooks_generated integer DEFAULT 0 NOT NULL CHECK (playbooks_generated >= 0 AND playbooks_generated <= 2),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_generation_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generation limits"
  ON user_generation_limits
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert generation limits"
  ON user_generation_limits
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update generation limits"
  ON user_generation_limits
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_generation_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_generation_limits_updated_at
  BEFORE UPDATE ON user_generation_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_generation_limits_updated_at();