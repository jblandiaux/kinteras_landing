import { useRef, useState, type FormEvent } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { CONSENT_TEXT } from '../../shared/consent';
import { joinEarlyAccess, readAttribution } from '../lib/api';
import { analytics } from '../lib/analytics';

type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Same permissive shape the Worker applies. Its job here is not validation --
 * the server still decides -- but to keep obvious typos out of the
 * submitted -> signup conversion ratio.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * The page's only conversion point.
 *
 * One field. No name, no password, no account -- every extra input is a reason
 * to leave. An address already on the list lands in `success` exactly like a new
 * one: the visitor asked to be notified, and they will be, so telling them
 * "this email already exists" would be a failure message for a non-failure.
 */
export function EarlyAccessForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const honeypotRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useReducedMotion();

  // Read once at submit time rather than on mount: nothing rerenders on it and
  // the URL cannot change under a static page.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'loading') return;

    const trimmed = email.trim();

    // Fires only once the input is plausibly an address, and never on the click
    // itself. Counting every click would fill the submitted -> signup ratio with
    // typos, and that ratio exists to expose network and backend failures.
    if (!EMAIL_SHAPE.test(trimmed)) {
      setStatus('error');
      return;
    }

    analytics.capture('early_access_submitted');
    setStatus('loading');
    try {
      await joinEarlyAccess({
        email: trimmed,
        attribution: readAttribution(),
        honeypot: honeypotRef.current?.value ?? '',
      });
      analytics.capture('early_access_signup');
      setStatus('success');
    } catch {
      // The typed email stays in state and therefore in the input -- making
      // someone retype an address because our server hiccuped is gratuitous.
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <m.div
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative rounded-2xl border border-brand-accent/35 bg-brand-surface/60 px-6 py-7
                   text-center md:text-left"
        role="status"
      >
        {/* Short, single-shot glow. Not a loop: a permanent effect on a
            confirmation is noise once the message has been read. */}
        {!reducedMotion && (
          <m.span
            aria-hidden="true"
            initial={{ opacity: 0.55, scale: 0.9 }}
            animate={{ opacity: 0, scale: 1.25 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-2xl bg-brand-accent/25 blur-2xl"
          />
        )}
        <p className="font-display text-3xl tracking-wide text-brand-accent">YOU&apos;RE IN.</p>
        <p className="mt-2 text-brand-ink-dim">
          We&apos;ll let you know when Kinteras Early Access begins.
        </p>
      </m.div>
    );
  }

  const isLoading = status === 'loading';

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <label htmlFor="early-access-email" className="screen-reader-only">
        Email address
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="early-access-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={isLoading}
          placeholder="you@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby="early-access-consent early-access-status"
          /*
           * Enough material to read as an enabled control. With the resting
           * border and a 70%-opacity placeholder it looked greyed out -- which
           * on the page's only conversion point is the worst possible signal.
           * It still stays clearly secondary to the gold button.
           */
          /*
           * w-full stacked, flex-1 only once the wrapper is a row.
           * A bare flex-1 sets flex-basis: 0% on whichever axis is the main one
           * -- which in the mobile flex-col wrapper is the HEIGHT, silently
           * overriding h-[54px] and collapsing the field to 22px against a
           * 54px button.
           */
          className="h-[54px] w-full rounded-[14px] border border-brand-border-strong sm:flex-1
                     bg-brand-surface/85 px-5 text-base text-brand-ink
                     placeholder:text-brand-ink-dim/85
                     transition-colors focus:border-brand-accent/70 focus:outline-none
                     disabled:opacity-60"
        />

        {/*
          Honeypot. Off-screen instead of display:none, which some bots skip;
          aria-hidden and tabIndex -1 keep it away from screen readers and the
          keyboard, so no human ever meets it.
        */}
        <div className="screen-reader-only" aria-hidden="true">
          <label htmlFor="early-access-website">Leave this field empty</label>
          <input
            ref={honeypotRef}
            id="early-access-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        <m.button
          type="submit"
          disabled={isLoading}
          whileHover={reducedMotion || isLoading ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion || isLoading ? undefined : { scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="inline-flex h-[54px] items-center justify-center gap-2.5 rounded-[14px]
                     bg-brand-accent px-7 text-sm font-extrabold tracking-[0.12em] text-[#1a1206]
                     transition-colors hover:bg-brand-accent-dim
                     disabled:cursor-not-allowed disabled:opacity-70 sm:px-8"
        >
          {isLoading && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-[#1a1206]/30
                         border-t-[#1a1206]"
            />
          )}
          {isLoading ? 'JOINING...' : 'JOIN KINTERAS'}
        </m.button>
      </div>

      {/*
        Rendered from shared/consent.ts, never retyped here: the stored
        consent_version has to resolve to this exact sentence for the record to
        mean anything.
      */}
      <p id="early-access-consent" className="mt-3.5 text-sm leading-relaxed text-brand-ink-dim">
        {CONSENT_TEXT}{' '}
        <a
          href="/privacy"
          className="underline decoration-brand-ink-dim/40 underline-offset-4
                     transition-colors hover:text-brand-ink"
        >
          Privacy
        </a>
      </p>

      <p
        id="early-access-status"
        role="alert"
        aria-live="polite"
        className="mt-2 min-h-5 text-sm text-red-400"
      >
        {status === 'error' ? 'Something went wrong. Please try again.' : ''}
      </p>
    </form>
  );
}
