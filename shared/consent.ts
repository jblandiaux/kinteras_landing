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
 * Adding a purpose means a NEW version and a fresh ask. It must never be a
 * silent widening of what earlier signers agreed to.
 */

export type ConsentRecord = {
  version: string;
  /** ISO date this wording went live. Shown on the privacy page. */
  since: string;
  text: string;
  /**
   * Whether this wording covers ongoing email beyond the one launch
   * notification. Only versions marked true may be pushed to the mailing-list
   * provider — see MARKETING_CONSENT_VERSIONS.
   */
  coversMarketing: boolean;
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
    coversMarketing: false,
  },
  {
    version: 'early-access-v2',
    since: '2026-08-25',
    text:
      "We'll email you about Kinteras development and when Early Access opens. " +
      'Unsubscribe any time.',
    coversMarketing: true,
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

/**
 * The versions whose wording actually permits ongoing email.
 *
 * This is the enforcement point for "a new purpose is never applied
 * retroactively". v1 signers were promised a single launch notification and
 * nothing else, so their addresses must never reach the mailing-list provider —
 * and that is a code check here, not a line in a policy document someone has to
 * remember.
 */
export const MARKETING_CONSENT_VERSIONS: ReadonlySet<string> = new Set(
  CONSENT_HISTORY.filter((entry) => entry.coversMarketing).map((entry) => entry.version),
);
