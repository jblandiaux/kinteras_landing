/**
 * Byte-range serving for the hero clip.
 *
 * Safari on iOS will not play a <video> whose server ignores `Range`: it opens
 * with `Range: bytes=0-1`, and a 200 carrying the whole file makes it give up,
 * leaving the poster on screen forever. Workers static assets answer ranges
 * with a plain 200, so /video/* is routed here (see run_worker_first) and the
 * slice is cut from the asset.
 *
 * The clip is ~2 MB, so reading it whole and slicing is simpler than streaming
 * a sub-range and costs nothing worth measuring.
 */

export const VIDEO_PREFIX = '/video/';

type ByteRange = { start: number; end: number };

/**
 * Parses a single `bytes=` range against a body of `size` bytes, returning the
 * inclusive span, `null` when the header is absent or not something we serve
 * (multi-range, other units -- answered with the full body, which is legal),
 * or `'unsatisfiable'` for a range entirely past the end.
 */
export function parseRange(header: string | null, size: number): ByteRange | null | 'unsatisfiable' {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return null;

  // Suffix form, `bytes=-N`: the last N bytes.
  if (rawStart === '') {
    const length = Number(rawEnd);
    if (length === 0) return 'unsatisfiable';
    return { start: Math.max(0, size - length), end: size - 1 };
  }

  const start = Number(rawStart);
  if (start >= size) return 'unsatisfiable';
  const end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1);
  if (end < start) return null;
  return { start, end };
}

/** Serves an asset, honouring a byte range when the request carries one. */
export async function serveWithRanges(request: Request, assets: Fetcher): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  }

  // Ask the asset store for the whole file: it would ignore the range anyway,
  // and a conditional header would only complicate the slice below.
  const asset = await assets.fetch(new Request(request.url, { method: 'GET' }));
  if (!asset.ok) return asset;

  const body = await asset.arrayBuffer();
  const size = body.byteLength;
  const headers = new Headers(asset.headers);
  headers.set('accept-ranges', 'bytes');

  const range = parseRange(request.headers.get('range'), size);

  if (range === 'unsatisfiable') {
    headers.set('content-range', `bytes */${size}`);
    headers.delete('content-length');
    return new Response(null, { status: 416, headers });
  }

  if (range === null) {
    headers.set('content-length', String(size));
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
  }

  const { start, end } = range;
  headers.set('content-range', `bytes ${start}-${end}/${size}`);
  headers.set('content-length', String(end - start + 1));
  const slice = request.method === 'HEAD' ? null : body.slice(start, end + 1);
  return new Response(slice, { status: 206, headers });
}
