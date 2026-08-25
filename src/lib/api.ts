import { CONSENT_VERSION } from '../../shared/consent';

/**
 * Campaign parameters, read from the URL the visitor arrived on.
 *
 * Kept separate from `source` on purpose: `source` says where in the product
 * the signup happened (always the landing, for now), `utm_*` says which campaign
 * delivered the click. Collapsing the two loses one of them as soon as there is
 * more than one channel.
 */
export type Attribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

export function readAttribution(search: string = window.location.search): Attribution {
  const params = new URLSearchParams(search);
  const attribution: Attribution = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
    const value = params.get(key)?.trim();
    if (value) attribution[key] = value.slice(0, 64);
  }
  return attribution;
}

export type SignupRequest = {
  email: string;
  attribution: Attribution;
  /**
   * Whatever the hidden honeypot field held at submit time. It must be read
   * from the live form rather than hardcoded here -- the point is to forward
   * what a bot typed into the DOM, and a constant empty string would forward
   * nothing and catch nobody.
   */
  honeypot: string;
};

/**
 * Records an email against the Early Access list.
 *
 * Resolves on success. An address that is already on the list also resolves --
 * the endpoint treats a repeat as a success, because from the visitor's side
 * the outcome they asked for is already true.
 *
 * Throws on a rejected address, a network failure or a server error, so the
 * form can tell the two apart.
 */
export async function joinEarlyAccess({
  email,
  attribution,
  honeypot,
}: SignupRequest): Promise<void> {
  const response = await fetch('/api/early-access', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      source: 'landing',
      consent_version: CONSENT_VERSION,
      website: honeypot,
      ...attribution,
    }),
  });

  if (!response.ok) {
    const detail: unknown = await response.json().catch(() => null);
    throw new Error(
      typeof detail === 'object' && detail !== null && 'error' in detail
        ? String((detail as { error: unknown }).error)
        : `request_failed_${response.status}`,
    );
  }
}
