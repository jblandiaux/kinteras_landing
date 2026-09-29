/**
 * Server half of the Turnstile check on the signup form.
 *
 * The browser gets a single-use token from the widget; only a siteverify call
 * made here, with the secret, proves a human solved it. Every failure mode --
 * missing secret, network error, non-2xx, malformed answer -- fails closed.
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const REQUEST_TIMEOUT_MS = 10_000;
/** Real tokens are well under this; anything longer is not one. */
const MAX_TOKEN_LENGTH = 2_048;

/** Must match `action` on the widget in src/components/EarlyAccessForm.tsx. */
export const SIGNUP_ACTION = 'signup';

type SiteverifyResult = {
  success?: unknown;
  action?: unknown;
  hostname?: unknown;
};

/**
 * True only when Cloudflare confirms the token, for the signup action, issued
 * on the very hostname serving this request.
 *
 * Tying the hostname to the request instead of a configured list means the
 * production Worker can never accept a token minted on localhost, even though
 * the widget allows localhost for local development.
 */
export async function verifyTurnstile(
  token: unknown,
  request: Request,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret) {
    console.error('turnstile: TURNSTILE_SECRET is not set, rejecting signup');
    return false;
  }
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return false;
  }

  const form = new URLSearchParams({ secret, response: token });
  const clientIp = request.headers.get('cf-connecting-ip');
  if (clientIp) form.set('remoteip', clientIp);

  let result: SiteverifyResult;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`siteverify ${response.status}`);
    result = (await response.json()) as SiteverifyResult;
  } catch (err) {
    console.error('turnstile: siteverify failed', err);
    return false;
  }

  return (
    result.success === true &&
    result.action === SIGNUP_ACTION &&
    result.hostname === new URL(request.url).hostname
  );
}
