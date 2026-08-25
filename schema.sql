-- Early Access signups.
--
-- `source` (where in the product the signup happened) and the `utm_*` columns
-- (which campaign delivered the click) are deliberately separate: collapsing
-- them means losing one the moment there is more than one acquisition channel.
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
  consent_version TEXT NOT NULL
);

-- Signups are read newest-first when exporting the list.
CREATE INDEX IF NOT EXISTS idx_early_access_created_at
  ON early_access_signup (created_at DESC);
