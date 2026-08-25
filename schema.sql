-- Early Access signups.
--
-- `source` (where in the product the signup happened) and the `utm_*` columns
-- (which campaign delivered the click) are deliberately separate: collapsing
-- them means losing one the moment there is more than one acquisition channel.
--
-- The attribution columns record what was true WHEN THE PERSON SIGNED UP, not
-- their first ever visit -- readAttribution() reads the URL at submit time.
-- Someone arriving from TikTok on Monday who signs up after a direct visit on
-- Wednesday is recorded as direct. True first-touch lives in PostHog's
-- $initial_utm_* person properties, which is where the dashboards read it.
--
-- `consent_version` resolves to a frozen text in shared/consent.ts. Together
-- with created_at it is the demonstrable record of what was agreed and when.
-- No IP address is stored -- it would add personal data without adding proof.
CREATE TABLE IF NOT EXISTS early_access_signup (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  email           TEXT NOT NULL UNIQUE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  source          TEXT NOT NULL DEFAULT 'landing',
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  referrer        TEXT,
  landing_path    TEXT,
  consent_version TEXT NOT NULL,
  -- 0 until the address has been accepted by the mailing-list provider. Only
  -- signups whose consent version covers marketing are ever pushed, so rows
  -- consented under early-access-v1 stay at 0 by design, not by failure.
  brevo_synced    INTEGER NOT NULL DEFAULT 0
);

-- Signups are read newest-first when exporting the list.
CREATE INDEX IF NOT EXISTS idx_early_access_created_at
  ON early_access_signup (created_at DESC);

-- Partial index: the interesting rows are the handful that still need pushing,
-- not the whole list.
CREATE INDEX IF NOT EXISTS idx_early_access_brevo_pending
  ON early_access_signup (brevo_synced)
  WHERE brevo_synced = 0;
