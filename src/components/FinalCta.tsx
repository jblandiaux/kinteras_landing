import { m, useReducedMotion } from 'framer-motion';
import { analytics } from '../lib/analytics';

/**
 * The closing ask, for the visitor who needed to see the loop before deciding.
 *
 * It scrolls back to the hero's form rather than rendering a second one. Two
 * forms would mean two pieces of state, two success states and two places for a
 * bug to hide, for one action.
 */
export function FinalCta() {
  const reducedMotion = useReducedMotion();

  function scrollToForm() {
    // The page's only genuine call-to-action click: the hero form is visible
    // from the start, so there is nothing to "open" up there.
    analytics.capture('early_access_cta_clicked');

    document.getElementById('early-access')?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
    // Focus follows the scroll, so a keyboard user lands in the field itself
    // rather than being dropped at the top of the document.
    window.setTimeout(
      () => document.getElementById('early-access-email')?.focus({ preventScroll: true }),
      reducedMotion ? 0 : 500,
    );
  }

  return (
    <section className="scene-cta px-5 py-24 sm:px-6 md:py-40">
      <m.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto flex max-w-[900px] flex-col items-center gap-5 text-center md:gap-7"
      >
        <h2
          className="font-display text-[2rem] leading-[1.12] font-bold text-balance text-brand-ink-warm
                     md:text-[3.75rem] md:leading-[1.08]"
        >
          Ready to turn your runs into an adventure?
        </h2>
        <p className="text-base text-[#c3cedd] md:text-[1.1875rem]">
          Early access opens soon. Be first through the gate.
        </p>

        <m.button
          type="button"
          onClick={scrollToForm}
          whileHover={reducedMotion ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="mt-1 inline-flex h-[54px] w-full items-center justify-center rounded-[14px] sm:w-auto
                     bg-brand-accent px-9 text-sm font-extrabold tracking-[0.12em] text-[#1a1206]
                     transition-colors hover:bg-brand-accent-dim"
        >
          JOIN THE EARLY ACCESS
        </m.button>
      </m.div>
    </section>
  );
}
