/**
 * The analytics consent contract, shared by kinteras.app and play.kinteras.app.
 *
 * This site asks the question; the game app only reads the answer. Both must
 * agree exactly on the cookie name, its scope and what each value means, or a
 * visitor who already chose here gets asked again in the app -- or worse, is
 * measured there after declining here.
 *
 * The two repos are deliberately independent, so this file exists in both.
 * `Kinetra_frontend/src/lib/analyticsConsent.ts` is its twin: change one, change
 * the other. The assertions that pin the contract live beside that copy, in
 * analyticsConsent.test.ts -- this repo has no test runner. Read them before
 * editing either side.
 *
 * Not to be confused with `shared/consent.ts` in this repo, which versions what
 * people agreed to receive by email. Same word, unrelated concept: that one is
 * about mail, this one is about measurement.
 */

export type ConsentChoice = 'accepted' | 'rejected';
/** No answer yet. Nothing may be captured in this state. */
export type ConsentState = ConsentChoice | 'pending';

export const CONSENT_COOKIE = 'kinteras_analytics_consent';

/**
 * Six months, after which the question is asked again rather than assumed to
 * still hold.
 */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/**
 * The registrable domain the cookie is scoped to, or null for a host-only
 * cookie.
 *
 * `.kinteras.app` is what lets the landing and the app read the same answer.
 * localhost, preview deployments and *.workers.dev get null: a Domain attribute
 * that does not match the current host is rejected outright by the browser, so
 * hardcoding it would silently break consent everywhere but production.
 */
export function consentCookieDomain(hostname: string): string | null {
  if (hostname === 'kinteras.app' || hostname.endsWith('.kinteras.app')) {
    return '.kinteras.app';
  }
  return null;
}

/** Reads the stored answer out of a `document.cookie` string. */
export function parseConsent(cookieString: string): ConsentState {
  const match = cookieString.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(accepted|rejected)(?:;|$)`),
  );
  return match ? (match[1] as ConsentChoice) : 'pending';
}

/** Builds the `document.cookie` assignment that records an answer. */
export function buildConsentCookie(
  choice: ConsentChoice,
  hostname: string,
  isSecure: boolean,
): string {
  return buildCookie(choice, CONSENT_MAX_AGE_SECONDS, hostname, isSecure);
}

/** Builds the assignment that forgets the answer, so the question is asked again. */
export function buildConsentClearCookie(hostname: string, isSecure: boolean): string {
  return buildCookie('', 0, hostname, isSecure);
}

function buildCookie(
  value: string,
  maxAge: number,
  hostname: string,
  isSecure: boolean,
): string {
  const domain = consentCookieDomain(hostname);
  const parts = [`${CONSENT_COOKIE}=${value}`, 'Path=/', `Max-Age=${maxAge}`, 'SameSite=Lax'];
  if (domain) parts.push(`Domain=${domain}`);
  // Secure is rejected outright over plain http, which is what local dev uses.
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}
