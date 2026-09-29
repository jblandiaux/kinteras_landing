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
  /** The individual piece of content — which video, not just which campaign. */
  utm_content?: string;
  referrer?: string;
  landing_path?: string;
};

/**
 * Captured once, when the module first loads.
 *
 * `document.referrer` is read at import time rather than at submit time: the
 * Privacy page is a full navigation, so someone who reads it and comes back
 * would otherwise be recorded as referred by our own site.
 */
const INITIAL_REFERRER = typeof document === 'undefined' ? '' : document.referrer;
const INITIAL_PATH = typeof window === 'undefined' ? '' : window.location.pathname;

export function readAttribution(search: string = window.location.search): Attribution {
  const params = new URLSearchParams(search);
  const attribution: Attribution = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const) {
    const value = params.get(key)?.trim();
    if (value) attribution[key] = value.slice(0, 64);
  }
  // Covers the traffic that arrives with no UTMs at all, which is most organic
  // traffic — without them a bare referrer is all there is to go on.
  if (INITIAL_REFERRER) attribution.referrer = INITIAL_REFERRER.slice(0, 512);
  if (INITIAL_PATH) attribution.landing_path = INITIAL_PATH.slice(0, 512);
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
  /** Single-use Turnstile token for this submission. */
  turnstileToken: string;
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
  turnstileToken,
}: SignupRequest): Promise<void> {
  const response = await fetch('/api/early-access', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email,
      source: 'landing',
      consent_version: CONSENT_VERSION,
      website: honeypot,
      turnstile_token: turnstileToken,
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
