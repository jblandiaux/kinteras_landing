import { m, useReducedMotion } from 'framer-motion';

/**
 * The five badges are the game's own achievement-category art: one consistent
 * gold-framed hexagon family, which sits with the wordmark far better than the
 * flat nav icons would.
 */
const STEPS = [
  { icon: '/assets/icons/run.webp', label: 'RUN' },
  { icon: '/assets/icons/loot.webp', label: 'EARN XP & LOOT' },
  { icon: '/assets/icons/creatures.webp', label: 'DISCOVER CREATURES' },
  { icon: '/assets/icons/fight.webp', label: 'FIGHT' },
  { icon: '/assets/icons/explore.webp', label: 'EXPLORE' },
] as const;

/**
 * The core loop, shown rather than described.
 *
 * Vertical on phones, horizontal from md up, with the connector drawn between
 * steps so the sequence reads as a cycle instead of five unrelated tiles.
 */
export function GameplayLoop() {
  const reducedMotion = useReducedMotion();

  const step = reducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
      };

  const connector = reducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { scaleX: 0, scaleY: 0, opacity: 0 },
        visible: {
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          transition: { duration: 0.35, ease: 'easeOut' as const },
        },
      };

  return (
    <section className="border-t border-brand-border/50 px-5 py-20 sm:px-6 md:py-28">
      <m.div
        initial="hidden"
        whileInView="visible"
        /* once: the loop reveals itself the first time it is reached and then
           stays put. Replaying on every scroll past would be decoration. */
        viewport={{ once: true, amount: 0.25 }}
        transition={{ staggerChildren: 0.12 }}
        className="mx-auto max-w-[1100px]"
      >
        <m.h2
          variants={step}
          className="text-center font-display text-3xl tracking-[0.12em] text-brand-accent
                     md:text-4xl"
        >
          YOUR RUN. YOUR ADVENTURE.
        </m.h2>

        <ol
          className="mt-14 flex flex-col items-center gap-0
                     md:mt-16 md:flex-row md:items-start md:justify-between"
        >
          {STEPS.map((entry, index) => (
            <li
              key={entry.label}
              className="flex flex-col items-center md:flex-1 md:flex-row md:items-start"
            >
              <m.div
                variants={step}
                className="flex w-[168px] shrink-0 flex-col items-center gap-3 text-center"
              >
                <img
                  src={entry.icon}
                  alt=""
                  aria-hidden="true"
                  width={192}
                  height={192}
                  loading="lazy"
                  decoding="async"
                  className="h-[72px] w-auto md:h-[80px]"
                />
                <span className="text-sm font-bold tracking-[0.1em] text-brand-ink text-balance">
                  {entry.label}
                </span>
              </m.div>

              {index < STEPS.length - 1 && (
                <m.span
                  aria-hidden="true"
                  variants={connector}
                  className="my-4 block h-8 w-px shrink-0 origin-top
                             bg-gradient-to-b from-brand-accent/60 to-brand-accent/10
                             md:my-0 md:mt-10 md:h-px md:w-full md:origin-left
                             md:bg-gradient-to-r md:from-brand-accent/50 md:to-brand-accent/15"
                />
              )}
            </li>
          ))}
        </ol>
      </m.div>
    </section>
  );
}
