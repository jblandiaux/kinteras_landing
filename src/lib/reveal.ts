import { useReducedMotion, type Variants } from 'framer-motion';

/** Travel, in px, of an element rising into place. Small: a settle, not a slide. */
const RISE_PX = 12;

const STILL: Variants = { hidden: {}, visible: {} };

/**
 * The page's one entrance: fade up a few pixels. Under reduced motion every
 * element renders in its final state instead -- no fade, no travel.
 *
 * Returned for the parent to spread onto `m.*` children that sit inside an
 * element carrying `initial="hidden"` and `whileInView` / `animate="visible"`.
 */
export function useRevealVariants(duration = 0.5): Variants {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return STILL;

  return {
    hidden: { opacity: 0, y: RISE_PX },
    visible: { opacity: 1, y: 0, transition: { duration, ease: 'easeOut' } },
  };
}

/**
 * Viewport trigger shared by every section below the fold. `once`: a section
 * reveals itself the first time it is reached and then stays put -- replaying
 * on every scroll past would be decoration.
 */
export const REVEAL_VIEWPORT = { once: true, amount: 0.2 } as const;
