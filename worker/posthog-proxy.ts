/**
 * First-party reverse proxy for PostHog.
 *
 * Ad blockers recognise analytics hostnames, and the audience this landing page
 * is aimed at (gaming, arriving from TikTok) blocks at a high rate. Served from
 * our own origin the requests are indistinguishable from the rest of the site.
 *
 * A path on the apex rather than a CNAME subdomain, on purpose: DNS-level
 * blockers (NextDNS, Pi-hole) follow a subdomain's CNAME chain and block it when
 * it lands on a known analytics provider. A path has no chain to follow.
 *
 * The route name is deliberately drawn from the game's vocabulary. `/analytics`,
 * `/tracking`, `/telemetry` and `/posthog` are themselves on blocklists.
 *
 * Cost note: every event, asset fetch and flag poll routed here is one more
 * Worker invocation against the account's quota. The client config keeps that
 * traffic to the minimum — see src/lib/analytics.ts.
 */

/** EU region — the project lives on PostHog Cloud EU. */
const POSTHOG_API_HOST = 'eu.i.posthog.com';
const POSTHOG_ASSET_HOST = 'eu-assets.i.posthog.com';

export const POSTHOG_PROXY_PREFIX = '/summon';

export async function proxyToPostHog(request: Request, pathname: string): Promise<Response> {
  const url = new URL(request.url);
  const path = pathname.slice(POSTHOG_PROXY_PREFIX.length) || '/';

  // Static assets (the SDK bundle itself) come from a different origin than
  // the ingestion API.
  const isAsset = path.startsWith('/static/');
  url.hostname = isAsset ? POSTHOG_ASSET_HOST : POSTHOG_API_HOST;
  url.protocol = 'https:';
  url.port = '';
  url.pathname = path;

  const forwarded = new Request(url, request);
  // Without this the upstream sees `kinteras.app` and its routing/TLS breaks.
  forwarded.headers.set('Host', url.hostname);

  const response = await fetch(forwarded);

  if (!isAsset) return response;

  // Assets are immutable and content-hashed upstream, but the response is
  // mutable here so the browser can cache them instead of re-billing a Worker
  // invocation on every page load.
  const cached = new Response(response.body, response);
  cached.headers.set('cache-control', 'public, max-age=86400');
  return cached;
}
