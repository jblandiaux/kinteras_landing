/**
 * Secrets, declared by hand.
 *
 * `wrangler types` generates Env from wrangler.jsonc, which lists plain vars but
 * cannot list secrets -- they exist only in Cloudflare, never in the config. It
 * can infer their names from a local `.dev.vars`, but CI has no such file, so
 * relying on that would make the build depend on an untracked file.
 *
 * Optional on purpose: with no key configured the Worker records the signup in
 * D1 and skips the push, which is what keeps the endpoint working before Brevo
 * is set up and if its credentials are ever revoked.
 */
interface Env {
  BREVO_API_KEY?: string;
  /**
   * Turnstile widget secret (`wrangler secret put TURNSTILE_SECRET`). Unlike
   * Brevo, missing is not a degraded mode: every signup is rejected until set.
   */
  TURNSTILE_SECRET?: string;
  /** Test-only override of the Brevo API origin. Never set in production. */
  BREVO_API_BASE?: string;
}
