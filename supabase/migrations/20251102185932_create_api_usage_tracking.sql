/*
  # Create API Usage Tracking Table

  1. New Table
    - `api_usage`
      - `id` (uuid, primary key)
      - `month` (text, format: YYYY-MM, unique)
      - `total_spend` (numeric, running total in dollars)
      - `playbooks_generated` (integer, count for the month)
      - `idea_sets_generated` (integer, count for the month)
      - `last_updated` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `api_usage` table
    - Only service role can read/write

  3. Notes
    - Tracks monthly API spending with costs:
      - Playbook generation: $0.013 each
      - Idea set generation: $0.005 each
    - Hard limit: $50/month
    - Auto-resets on 1st of each month
    - Month format: 2025-01 for January 2025
*/

CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text UNIQUE NOT NULL,
  total_spend numeric(10, 4) DEFAULT 0 NOT NULL CHECK (total_spend >= 0),
  playbooks_generated integer DEFAULT 0 NOT NULL CHECK (playbooks_generated >= 0),
  idea_sets_generated integer DEFAULT 0 NOT NULL CHECK (idea_sets_generated >= 0),
  last_updated timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can read api_usage"
  ON api_usage
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert api_usage"
  ON api_usage
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update api_usage"
  ON api_usage
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_api_usage_month ON api_usage(month);