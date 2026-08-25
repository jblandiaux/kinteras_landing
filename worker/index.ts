import { KNOWN_CONSENT_VERSIONS } from '../shared/consent';

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
const MAX_BODY_BYTES = 2_048;
const MAX_UTM_LENGTH = 64;

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
function cleanTag(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(CONTROL_CHARS_RE, '').trim().slice(0, MAX_UTM_LENGTH);
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

  try {
    // ON CONFLICT DO NOTHING: re-submitting an address is a success from the
    // visitor's point of view -- they wanted to be on the list and they are.
    // It also means attribution stays first-touch, which is the honest reading
    // of "where did this person come from".
    await env.DB.prepare(
      `INSERT INTO early_access_signup
         (email, source, utm_source, utm_medium, utm_campaign, consent_version)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT (email) DO NOTHING`,
    )
      .bind(
        email,
        cleanTag(body.source) ?? 'landing',
        cleanTag(body.utm_source),
        cleanTag(body.utm_medium),
        cleanTag(body.utm_campaign),
        consentVersion,
      )
      .run();
  } catch (err) {
    console.error('early-access insert failed', err);
    return json({ success: false, error: 'server_error' }, 500);
  }

  return json({ success: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/early-access' || pathname === '/api/early-access/') {
      return handleEarlyAccess(request, env);
    }

    // Reached only for /api/* (see run_worker_first). Answering 404 in JSON
    // keeps a typo'd endpoint from being handed the SPA's index.html.
    return json({ success: false, error: 'not_found' }, 404);
  },
} satisfies ExportedHandler<Env>;
