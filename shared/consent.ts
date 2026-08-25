/**
 * The consent record, shared verbatim between the form that displays it, the
 * privacy page that archives it and the Worker that validates it.
 *
 * Under GDPR accountability you must be able to demonstrate *what* someone
 * agreed to, not merely that they clicked. A version string in the database
 * only proves something if it resolves to a frozen text — so the text lives
 * here, every surface renders it from here instead of keeping its own copy, and
 * git history timestamps each change.
 *
 * Adding a purpose (news, dev updates, offers) means a NEW version and a fresh
 * ask. It must never be a silent widening of what v1 signers agreed to.
 */

export type ConsentRecord = {
  version: string;
  /** ISO date this wording went live. Shown on the privacy page. */
  since: string;
  text: string;
};

/**
 * Newest last. Old entries are never edited or removed: someone who signed up
 * under v1 agreed to v1's wording, and that has to stay resolvable.
 */
export const CONSENT_HISTORY: readonly ConsentRecord[] = [
  {
    version: 'early-access-v1',
    since: '2026-08-25',
    text: "We'll only use your email to let you know when Kinteras Early Access opens.",
  },
];

const CURRENT = CONSENT_HISTORY[CONSENT_HISTORY.length - 1];

export const CONSENT_VERSION = CURRENT.version;
export const CONSENT_TEXT = CURRENT.text;

/**
 * Every version the endpoint accepts, derived from the history rather than
 * maintained beside it — a hand-kept second list is a list that drifts.
 *
 * Superseded versions stay accepted on purpose: a visitor with a stale tab open
 * submitted against the text they were actually shown, and recording that is the
 * whole point.
 */
export const KNOWN_CONSENT_VERSIONS: Record<string, string> = Object.fromEntries(
  CONSENT_HISTORY.map((entry) => [entry.version, entry.text]),
);
