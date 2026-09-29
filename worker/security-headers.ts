/**
 * Security headers for the responses the Worker builds itself.
 *
 * Static assets get theirs from public/_headers, which the platform applies
 * only to what it serves. Anything answered from this code -- the signup
 * endpoint, the analytics proxy, the video ranges -- would otherwise go out
 * bare. None of these responses is HTML, so a CSP adds nothing here.
 */
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

/** Returns a copy of `response` carrying the security headers. */
export function withSecurityHeaders(response: Response): Response {
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    secured.headers.set(name, value);
  }
  return secured;
}
