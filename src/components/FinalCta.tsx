import { m, useReducedMotion } from 'framer-motion';

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
    <section className="border-t border-brand-border/50 px-5 py-20 sm:px-6 md:py-24">
      <m.div
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mx-auto max-w-[640px] text-center"
      >
        <p className="text-3xl leading-tight font-extrabold tracking-[-0.01em] text-balance md:text-4xl">
          READY TO TURN YOUR RUNS INTO AN ADVENTURE?
        </p>

        <m.button
          type="button"
          onClick={scrollToForm}
          whileHover={reducedMotion ? undefined : { scale: 1.02 }}
          whileTap={reducedMotion ? undefined : { scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="mt-8 inline-flex h-[54px] items-center justify-center rounded-[14px]
                     bg-brand-accent px-9 text-sm font-extrabold tracking-[0.12em] text-[#1a1206]
                     transition-colors hover:bg-brand-accent-dim"
        >
          JOIN THE EARLY ACCESS
        </m.button>
      </m.div>
    </section>
  );
}
