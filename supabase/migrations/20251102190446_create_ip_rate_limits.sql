/*
  # Create IP Rate Limits Table

  1. New Table
    - `ip_rate_limits`
      - `id` (uuid, primary key)
      - `ip_address` (text, unique, the client IP)
      - `playbooks_today` (integer, playbook generations today)
      - `ideas_today` (integer, idea set generations today)
      - `last_reset` (date, last time counters were reset)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ip_rate_limits` table
    - Only service role can read/write

  3. Notes
    - Prevents abuse from multiple emails on same IP
    - Limits per IP per day:
      - Max 10 playbook generations
      - Max 20 idea set generations
    - Auto-resets daily at midnight
    - Allows legitimate household use while blocking abuse
*/

CREATE TABLE IF NOT EXISTS ip_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  playbooks_today integer DEFAULT 0 NOT NULL CHECK (playbooks_today >= 0),
  ideas_today integer DEFAULT 0 NOT NULL CHECK (ideas_today >= 0),
  last_reset date DEFAULT CURRENT_DATE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE ip_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read ip_rate_limits"
  ON ip_rate_limits
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert ip_rate_limits"
  ON ip_rate_limits
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update ip_rate_limits"
  ON ip_rate_limits
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ip_rate_limits_ip ON ip_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_rate_limits_last_reset ON ip_rate_limits(last_reset);