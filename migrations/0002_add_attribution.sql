-- Full marketing attribution on the signup row.
--
-- utm_content is the one that answers the question the whole exercise exists
-- for: which individual piece of content converts. Campaign-level data cannot
-- distinguish video_017 from video_018.
--
-- referrer and landing_path cover the traffic that arrives without UTMs at all,
-- which is most organic traffic.
--
-- Note on semantics: these record the attribution present WHEN THE PERSON
-- SIGNED UP, not their first ever visit. Someone who arrives from TikTok on
-- Monday and signs up after a direct visit on Wednesday is recorded as direct.
-- True first-touch lives in PostHog's $initial_utm_* person properties.
ALTER TABLE early_access_signup ADD COLUMN utm_content  TEXT;
ALTER TABLE early_access_signup ADD COLUMN referrer     TEXT;
ALTER TABLE early_access_signup ADD COLUMN landing_path TEXT;
