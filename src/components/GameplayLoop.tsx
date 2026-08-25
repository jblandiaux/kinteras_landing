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
                     md:mt-16 md:flex-row md:items-start"
        >
          {STEPS.map((entry, index) => (
            <li
              key={entry.label}
              /* basis-0 via flex-1 makes every column the same width whatever
                 its label wraps to, which is what lets the connector below be
                 positioned from column centres. */
              className="relative flex flex-col items-center md:flex-1"
            >
              <m.div
                variants={step}
                /*
                 * Fixed width stacked vertically, column width once side by
                 * side. Keeping the 168px box on desktop meant 5 x 168 = 840px
                 * of unshrinkable content inside a 752px row just above the md
                 * breakpoint, which scrolled the whole page sideways.
                 */
                className="flex w-[168px] shrink-0 flex-col items-center gap-3 px-2 text-center
                           md:w-full md:min-w-0"
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
                /*
                 * Vertical and in flow on mobile; on desktop it is taken out of
                 * flow and anchored between two badge centres.
                 *
                 * In flow it could only ever start at the edge of the 168px
                 * label box, ~50px clear of the badge it is supposed to touch,
                 * and it needed a magic top margin to guess the badge's
                 * half-height. Here `left: 50% + 2.75rem` leaves this badge and
                 * `right: -50% + 2.75rem` reaches the next column's centre and
                 * stops just short of its badge, so the line meets the artwork
                 * at both ends and stays put whatever the labels do.
                 *
                 * top-10 is the badge's own half-height (md:h-[80px]).
                 */
                <m.span
                  aria-hidden="true"
                  variants={connector}
                  className="my-4 block h-8 w-px shrink-0 origin-top
                             bg-gradient-to-b from-brand-accent/60 to-brand-accent/10
                             md:absolute md:top-10 md:my-0 md:h-px md:w-auto md:origin-left
                             md:left-[calc(50%+2.75rem)] md:right-[calc(-50%+2.75rem)]
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
