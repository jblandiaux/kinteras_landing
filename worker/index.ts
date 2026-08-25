import { KNOWN_CONSENT_VERSIONS, MARKETING_CONSENT_VERSIONS } from '../shared/consent';
import { addContactToBrevo } from './brevo';
import { POSTHOG_PROXY_PREFIX, proxyToPostHog } from './posthog-proxy';

/**
 * The whole server side of the landing: one endpoint that records an email.
 *
 * Static assets are served by the platform, not by this code -- `run_worker_first`
 * in wrangler.jsonc routes only /api/* here, everything else falls through to the
 * built SPA.
 */

/** Longest legal email address per RFC 5321. */
const MAX_EMAIL_LENGTH = 254;
/** Nothing legitimate comes close; the cap just stops a body from being a DoS. */
const MAX_BODY_BYTES = 4_096;
const MAX_UTM_LENGTH = 64;
const MAX_URL_LENGTH = 512;

/**
 * Deliberately permissive. Server-side regexes that try to be clever reject real
 * addresses (plus-tags, new TLDs, unicode domains) far more often than they catch
 * anything useful; the actual proof an address works is the send.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/** C0 controls and DEL, which have no business in any field we store. */
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // The endpoint is same-origin with the page and its answers are never
      // worth reusing.
      'cache-control': 'no-store',
    },
  });
}

/** Trims, caps and strips control characters from an optional free-text field. */
function cleanTag(value: unknown, maxLength = MAX_UTM_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(CONTROL_CHARS_RE, '').trim().slice(0, maxLength);
  return cleaned.length > 0 ? cleaned : null;
}

async function handleEarlyAccess(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ success: false, error: 'method_not_allowed' }, 405);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ success: false, error: 'payload_too_large' }, 413);
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ success: false, error: 'invalid_body' }, 400);
  }

  // Honeypot. A hidden field a human never sees and never fills; if it has a
  // value, answer exactly as we would on success so the bot learns nothing, and
  // write nothing.
  if (cleanTag(body.website) !== null) {
    return json({ success: true });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return json({ success: false, error: 'invalid_email' }, 400);
  }

  // The client sends the consent version it actually rendered. Validating it
  // against the known set is what makes the stored value evidence: an unchecked
  // column could hold anything and would prove nothing.
  const consentVersion = typeof body.consent_version === 'string' ? body.consent_version : '';
  if (!Object.hasOwn(KNOWN_CONSENT_VERSIONS, consentVersion)) {
    return json({ success: false, error: 'invalid_consent_version' }, 400);
  }

  // A repeat submission leaves the original row alone -- same email, same
  // person, and the attribution recorded the first time is the one worth
  // keeping -- with one exception: the consent version.
  //
  // Someone who signed up under a launch-notification-only wording and comes
  // back under a broader one has genuinely agreed to more. Leaving the stored
  // version at the older one makes the record understate what they consented
  // to, and produces rows that read as "narrow consent, yet on the mailing
  // list" to anyone auditing the table.
  //
  // The upgrade only ever widens: the WHERE clause refuses to overwrite a
  // version that already covers marketing, so a stale tab submitting an old
  // wording cannot narrow an existing record.
  const marketingVersions = [...MARKETING_CONSENT_VERSIONS];
  const upgradesConsent = marketingVersions.includes(consentVersion);
  const conflictClause = upgradesConsent
    ? `ON CONFLICT (email) DO UPDATE SET consent_version = excluded.consent_version
         WHERE early_access_signup.consent_version NOT IN (${marketingVersions
           .map(() => '?')
           .join(', ')})`
    : 'ON CONFLICT (email) DO NOTHING';

  try {
    await env.DB.prepare(
      `INSERT INTO early_access_signup
         (email, source, utm_source, utm_medium, utm_campaign, utm_content,
          referrer, landing_path, consent_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ${conflictClause}`,
    )
      .bind(
        email,
        cleanTag(body.source) ?? 'landing',
        cleanTag(body.utm_source),
        cleanTag(body.utm_medium),
        cleanTag(body.utm_campaign),
        cleanTag(body.utm_content),
        // Referrers and paths are longer than a campaign tag; MAX_URL_LENGTH
        // keeps them usable without letting a crafted body bloat a row.
        cleanTag(body.referrer, MAX_URL_LENGTH),
        cleanTag(body.landing_path, MAX_URL_LENGTH),
        consentVersion,
        ...(upgradesConsent ? marketingVersions : []),
      )
      .run();
  } catch (err) {
    console.error('early-access insert failed', err);
    return json({ success: false, error: 'server_error' }, 500);
  }

  // The mailing list is downstream of the record, never a precondition for it.
  //
  // Only wordings that actually promised ongoing email reach Brevo. Someone who
  // signed up under a launch-notification-only version stays out of it, and
  // that boundary is enforced here rather than left to whoever runs the next
  // import.
  if (MARKETING_CONSENT_VERSIONS.has(consentVersion)) {
    const result = await addContactToBrevo(env, email);
    if (result === 'synced') {
      try {
        await env.DB.prepare(
          'UPDATE early_access_signup SET brevo_synced = 1 WHERE email = ?',
        )
          .bind(email)
          .run();
      } catch (err) {
        // Worth a log, not an error response: the address is on both lists,
        // only our bookkeeping of that fact is behind. A later resync will
        // push it again, which Brevo treats as a no-op.
        console.error('brevo_synced update failed', err);
      }
    }
  }

  // Whatever Brevo did, the signup is recorded and the visitor is on the list.
  return json({ success: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/early-access' || pathname === '/api/early-access/') {
      return handleEarlyAccess(request, env);
    }

    // Analytics traffic, served from our own origin so blockers see nothing
    // they recognise. Checked before the /api 404 below because it is not an
    // /api route at all.
    if (pathname === POSTHOG_PROXY_PREFIX || pathname.startsWith(`${POSTHOG_PROXY_PREFIX}/`)) {
      return proxyToPostHog(request, pathname);
    }

    // Reached only for /api/* (see run_worker_first). Answering 404 in JSON
    // keeps a typo'd endpoint from being handed the SPA's index.html.
    return json({ success: false, error: 'not_found' }, 404);
  },
} satisfies ExportedHandler<Env>;
