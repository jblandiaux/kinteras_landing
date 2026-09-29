import { m } from 'framer-motion';
import { REVEAL_VIEWPORT, useRevealVariants } from '../lib/reveal';
import { SectionHeading } from './SectionHeading';

/**
 * The five emblems are the game's own achievement-category art (regenerated
 * by `npm run assets:prepare`), so the loop matches what a player meets in-app.
 */
const STEPS = [
  { icon: '/assets/icons/run.webp', label: 'RUN', detail: 'Any run, any pace.' },
  { icon: '/assets/icons/loot.webp', label: 'EARN XP & LOOT', detail: 'Every kilometre counts.' },
  {
    icon: '/assets/icons/creatures.webp',
    label: 'DISCOVER CREATURES',
    detail: 'Summon. Collect. Evolve.',
  },
  { icon: '/assets/icons/fight.webp', label: 'FIGHT', detail: 'Element versus element.' },
  { icon: '/assets/icons/explore.webp', label: 'EXPLORE', detail: 'Push deeper into the map.' },
] as const;

/**
 * The core loop, shown rather than described.
 *
 * Rows on phones (emblem beside its caption, so five steps fit one screen),
 * five columns from md up with a gold thread through the emblems so the
 * sequence reads as one path instead of five tiles.
 */
export function GameplayLoop() {
  const item = useRevealVariants(0.4);

  return (
    <section
      id="loop"
      aria-labelledby="loop-title"
      className="bg-gradient-to-b from-brand-bg to-brand-bg-deep px-5 py-14 sm:px-6
                 md:px-10 md:py-26 lg:px-24"
    >
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        transition={{ staggerChildren: 0.1 }}
        className="mx-auto max-w-[1248px]"
      >
        <SectionHeading id="loop-title" eyebrow="THE LOOP" variants={item} align="center">
          Your run. <br className="md:hidden" />
          Your adventure.
        </SectionHeading>

        <div className="relative mt-7 md:mt-16">
          {/* The thread, through the emblems' centres (half of the 96px emblem). */}
          <span
            aria-hidden="true"
            className="absolute inset-x-[10%] top-12 hidden h-px md:block
                       bg-gradient-to-r from-brand-accent/10 via-brand-accent/55 to-brand-accent/10"
          />

          <ol className="relative flex flex-col gap-2 md:grid md:grid-cols-5 md:gap-4">
            {STEPS.map((step) => (
              <m.li
                key={step.label}
                variants={item}
                className="flex items-center gap-4 md:flex-col md:gap-3.5 md:text-center"
              >
                <img
                  src={step.icon}
                  alt=""
                  width={192}
                  height={192}
                  loading="lazy"
                  decoding="async"
                  className="size-16 shrink-0 object-contain md:size-24"
                />
                <div className="flex flex-col gap-1 md:items-center md:gap-2">
                  <span className="text-sm font-extrabold tracking-[0.12em] md:text-[0.9375rem]">
                    {step.label}
                  </span>
                  <span className="text-[0.9375rem] leading-normal text-brand-ink-dim md:max-w-[190px]">
                    {step.detail}
                  </span>
                </div>
              </m.li>
            ))}
          </ol>
        </div>
      </m.div>
    </section>
  );
}
