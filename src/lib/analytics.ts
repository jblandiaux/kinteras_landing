import type { PostHog } from 'posthog-js';

/**
 * The only place this app talks to PostHog.
 *
 * Everything else calls `analytics.capture(...)`. Nothing imports `posthog-js`
 * directly, so the provider, the configuration and the consent rules can change
 * in one file instead of across every component.
 *
 * The SDK is loaded as its own chunk, never statically. Imported normally it
 * adds ~86 KB gzipped to the critical bundle — more than doubling it — on a page
 * whose entire argument is that it loads instantly, and it would cost that to
 * every visitor including the ones who decline. Split out, the main bundle is
 * untouched and the SDK arrives in parallel.
 *
 * Calls made before it lands are queued rather than dropped, so nothing has to
 * know or care whether it has loaded yet.
 */

/**
 * Public project key. Safe in client code by design — it can write events and
 * nothing else. The secret key is never used from a browser.
 */
const POSTHOG_KEY = 'phc_ro2bcZi7fMUZwNdCiroUhqeBVwexhhdA7Hdi4ouUyrw8';

/**
 * Our own origin, not PostHog's. See worker/posthog-proxy.ts for why.
 * Relative so it works identically on localhost, on workers.dev and on the
 * apex, without a build-time switch.
 */
const PROXY_PATH = '/summon';

export type ConsentChoice = 'accepted' | 'rejected';

const CONSENT_COOKIE = 'kinteras_analytics_consent';

/**
 * Six months, the period beyond which a consent should be asked again rather
 * than assumed to still hold.
 */
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

/**
 * The choice lives in a cookie on the registrable domain, not in localStorage.
 *
 * localStorage is partitioned per origin, so a choice made on kinteras.app would
 * be invisible to play.kinteras.app and the person would be asked twice for the
 * same thing. A cookie scoped to `.kinteras.app` is read by both.
 *
 * Storing a privacy preference is functional storage: remembering that someone
 * said no is not something you need their permission for.
 */
function consentCookieDomain(): string | null {
  const { hostname } = window.location;
  if (hostname === 'kinteras.app' || hostname.endsWith('.kinteras.app')) return '.kinteras.app';
  // localhost and *.workers.dev get a host-only cookie. A Domain attribute that
  // does not match the current host is rejected outright by the browser, which
  // would silently break consent in development.
  return null;
}

export function readConsent(): ConsentChoice | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=(accepted|rejected)(?:;|$)`),
  );
  return match ? (match[1] as ConsentChoice) : null;
}

function writeConsent(choice: ConsentChoice): void {
  const domain = consentCookieDomain();
  const parts = [
    `${CONSENT_COOKIE}=${choice}`,
    'Path=/',
    `Max-Age=${CONSENT_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
  ];
  if (domain) parts.push(`Domain=${domain}`);
  // Secure is rejected on plain http, which is what local development uses.
  if (window.location.protocol === 'https:') parts.push('Secure');
  document.cookie = parts.join('; ');
}

let client: PostHog | null = null;
/** Work requested before the SDK finished loading. Replayed in order. */
let pending: Array<(ph: PostHog) => void> = [];

function withClient(fn: (ph: PostHog) => void): void {
  if (client) fn(client);
  else pending.push(fn);
}

/**
 * Applies a stored or freshly made choice to the SDK.
 *
 * `captureEventName: false` matters: `opt_in_capturing()` emits an `$opt_in`
 * event by default, and this runs on every page load for anyone who has already
 * accepted — which would mean one junk event per pageview, forever.
 */
function applyConsent(choice: ConsentChoice): void {
  withClient((ph) => {
    if (choice === 'accepted') ph.opt_in_capturing({ captureEventName: false });
    else ph.opt_out_capturing();
  });
}

let initialised = false;

export function initAnalytics(): void {
  if (initialised) return;
  initialised = true;

  void import('posthog-js').then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host: PROXY_PATH,
      ui_host: 'https://eu.posthog.com',

      // Nothing is captured until the visitor accepts or rejects. On rejection
      // PostHog switches to a server-side privacy-preserving hash: no cookie, no
      // local storage, but the visit is still counted.
      //
      // This requires "cookieless server hash mode" to be enabled on the PostHog
      // project. Without it, every rejected-consent event is silently discarded
      // at ingestion.
      cookieless_mode: 'on_reject',

      // Identity has to survive kinteras.app -> play.kinteras.app, or the
      // question "which campaign produced an activated player" can never be
      // answered.
      cross_subdomain_cookie: true,
      // Singular. The docs page writes `'cookies'`, but the SDK's own type is
      // `'localStorage' | 'cookie'` -- following the docs here does not compile,
      // and in plain JS would have silently fallen back to the default.
      opt_out_capturing_persistence_type: 'cookie',

      capture_pageview: true,
      // Autocapture records every click on the page. That is precisely the
      // "second logging system" this setup exists to avoid: four named events
      // answer the questions we actually have.
      autocapture: false,

      // None of these are used here, and each one that stays on costs both
      // noise and Worker invocations through the proxy.
      advanced_disable_feature_flags: true,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
    });

    client = posthog;

    const stored = readConsent();
    // No stored choice: deliberately do nothing. `on_reject` holds capture
    // until a decision exists, and the banner is what produces one.
    if (stored) applyConsent(stored);

    const queued = pending;
    pending = [];
    for (const fn of queued) fn(posthog);
  });
}

/**
 * Records the visitor's choice and applies it immediately.
 *
 * The two branches are not symmetrical, which is only visible by watching what
 * actually reaches ingestion:
 *
 * - Accepting emits no pageview of its own. PostHog captured one at init, but
 *   capture was still held then, so it was dropped and is never replayed. Left
 *   alone, every first visit reaches the funnel with clicks and no pageview,
 *   and the first step of the funnel reads zero.
 * - Declining does emit one, as part of switching into cookieless mode. Firing
 *   ours as well double-counts every rejecting visitor.
 *
 * On later visits neither applies: the stored choice is already in effect when
 * init runs, so PostHog handles the pageview itself.
 */
export function setConsent(choice: ConsentChoice): void {
  writeConsent(choice);
  applyConsent(choice);
  if (choice === 'accepted') withClient((ph) => ph.capture('$pageview'));
}

/**
 * Forgets the stored choice so the banner asks again.
 *
 * Withdrawing has to be as easy as giving, so the privacy page exposes this.
 * Capture is stopped immediately rather than at the next decision — leaving it
 * running until the visitor answers a second time would make "change my mind"
 * do nothing for whoever closes the tab first.
 */
export function clearConsent(): void {
  const domain = consentCookieDomain();
  const parts = [`${CONSENT_COOKIE}=`, 'Path=/', 'Max-Age=0', 'SameSite=Lax'];
  if (domain) parts.push(`Domain=${domain}`);
  if (window.location.protocol === 'https:') parts.push('Secure');
  document.cookie = parts.join('; ');
  withClient((ph) => ph.opt_out_capturing());
}

export type AnalyticsProperties = Record<string, unknown>;

export const analytics = {
  capture(event: string, properties?: AnalyticsProperties) {
    withClient((ph) => ph.capture(event, properties));
  },

  /**
   * Only ever called with an opaque internal id. Never a pseudo, an email, a
   * device UUID (that one is an authentication secret), a JWT or a Strava
   * token. Unused on the landing — it exists so the app can share this module.
   */
  identify(userId: string, properties?: AnalyticsProperties) {
    withClient((ph) => ph.identify(userId, properties));
  },

  reset() {
    withClient((ph) => ph.reset());
  },
};
