import { useEffect, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { readConsent, setConsent, type ConsentChoice } from '../lib/analytics';

/**
 * Analytics consent.
 *
 * Deliberately small and anchored to the bottom. This page has exactly one
 * conversion point and a banner that covers it, or that has to be dismissed
 * before the visitor can act, costs signups — which is the only thing the
 * analytics behind it are meant to measure.
 *
 * Both answers are one click and given equal weight. A "reject" hidden behind a
 * second screen is not a free choice, and an unfree consent is not a consent.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Read after mount rather than during render: cookies are not available
    // during SSR-shaped rendering and this keeps the first paint identical
    // whatever the stored choice is.
    setVisible(readConsent() === null);
  }, []);

  if (!visible) return null;

  function choose(choice: ConsentChoice) {
    setConsent(choice);
    setVisible(false);
  }

  return (
    <m.div
      role="dialog"
      aria-label="Analytics consent"
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div
        className="mx-auto flex max-w-[760px] flex-col gap-4 rounded-2xl border
                   border-brand-border-strong bg-brand-surface/95 p-5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)]
                   backdrop-blur sm:flex-row sm:items-center sm:gap-6"
      >
        <p className="flex-1 text-sm leading-relaxed text-brand-ink-dim">
          We use analytics to understand which posts bring people here. Decline and we still
          count the visit, without cookies and without recognising you.{' '}
          <a
            href="/privacy"
            className="text-brand-ink underline decoration-brand-ink-dim/40 underline-offset-4"
          >
            Privacy
          </a>
        </p>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose('rejected')}
            className="h-11 flex-1 rounded-xl border border-brand-border-strong px-5 text-sm
                       font-semibold text-brand-ink transition-colors
                       hover:bg-brand-surface-alt sm:flex-none"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose('accepted')}
            className="h-11 flex-1 rounded-xl bg-brand-accent px-5 text-sm font-extrabold
                       text-[#1a1206] transition-colors hover:bg-brand-accent-dim sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </m.div>
  );
}
