/**
 * Mailing-list provider. Brevo is the *copy*, D1 is the list.
 *
 * Keeping D1 authoritative is deliberate: it means a Brevo outage, a pricing
 * change or a decision to leave costs nothing but a re-import, and a failed push
 * is a row to retry rather than a signup that silently never happened.
 */

const BREVO_API_BASE = 'https://api.brevo.com';

/**
 * Overridable so the consent boundary can be exercised against a stub rather
 * than asserted in prose. Unset in production, where the default applies.
 */
function contactsEndpoint(env: Env): string {
  return `${env.BREVO_API_BASE || BREVO_API_BASE}/v3/contacts`;
}

/** A signup must never wait on a slow third party. */
const REQUEST_TIMEOUT_MS = 5_000;

export type BrevoResult = 'synced' | 'skipped' | 'failed';

/**
 * Adds an address to the configured Brevo list.
 *
 * `updateEnabled` makes this idempotent: a brand-new contact answers 201, one
 * that already exists answers 204 instead of the 400 the API would otherwise
 * return. Re-submitting an address therefore also heals a push that failed
 * earlier.
 *
 * Returns 'skipped' when Brevo is not configured, so the endpoint keeps working
 * before the credentials exist and if they are ever removed.
 */
export async function addContactToBrevo(env: Env, email: string): Promise<BrevoResult> {
  // Trimmed: a key pasted with a stray space or newline authenticates as a
  // different string and comes back 401, with nothing to distinguish it from a
  // genuinely wrong key.
  const apiKey = env.BREVO_API_KEY?.trim();
  const rawListId = env.BREVO_LIST_ID?.trim() ?? '';
  const listId = Number(rawListId);
  const listIdIsValid = rawListId !== '' && Number.isInteger(listId) && listId > 0;

  // Not configured at all is a legitimate state -- the endpoint is meant to work
  // before Brevo exists. A key with an unusable list id is not: that is a typo,
  // and skipping it quietly would drop every signup's push with nothing in the
  // logs to say why. The Brevo UI labels lists "#6", which is exactly the value
  // people paste in.
  if (apiKey && !listIdIsValid) {
    console.error(
      `brevo misconfigured: BREVO_LIST_ID is ${JSON.stringify(rawListId)}, expected a positive integer`,
    );
    return 'failed';
  }

  if (!apiKey || !listIdIsValid) return 'skipped';

  try {
    const response = await fetch(contactsEndpoint(env), {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      // Only the address and the list. The campaign data stays in D1 rather
      // than being mirrored into Brevo attributes, which have to be declared in
      // the Brevo account first -- an undeclared attribute makes the whole call
      // 400, which would leave every signup unsynced until someone noticed.
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.ok) return 'synced';

    console.error('brevo push rejected', response.status, await response.text().catch(() => ''));
    return 'failed';
  } catch (err) {
    console.error('brevo push failed', err);
    return 'failed';
  }
}
