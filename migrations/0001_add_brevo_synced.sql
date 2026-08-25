-- Tracks whether a signup reached the mailing-list provider.
--
-- The signup is written to D1 first and answered as a success regardless of
-- what Brevo does: the visitor asked to be on the list, and D1 is the list.
-- This column is what makes a failed push recoverable instead of invisible --
-- without it, the only way to find who is missing would be to diff two systems
-- by hand.
ALTER TABLE early_access_signup
  ADD COLUMN brevo_synced INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_early_access_brevo_pending
  ON early_access_signup (brevo_synced)
  WHERE brevo_synced = 0;
