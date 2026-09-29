import { m } from 'framer-motion';
import { REVEAL_VIEWPORT, useRevealVariants } from '../lib/reveal';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  { number: '01', title: 'Connect Strava', detail: 'One tap. Your runs sync on their own.' },
  { number: '02', title: 'Go for a run', detail: 'Same route, same watch. Nothing changes outside.' },
  { number: '03', title: 'Open Kinteras', detail: 'Your distance is waiting. Spend it.' },
] as const;

/**
 * The answer to "what do I have to change?" -- nothing. Three steps, the first
 * of which is the only setup there is.
 */
export function HowItWorks() {
  const item = useRevealVariants();

  return (
    <section
      id="how"
      aria-labelledby="how-title"
      className="bg-brand-bg px-5 py-14 sm:px-6 md:px-10 md:py-26 lg:px-24"
    >
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        transition={{ staggerChildren: 0.1 }}
        className="mx-auto max-w-[1248px]"
      >
        <SectionHeading id="how-title" eyebrow="HOW IT WORKS" variants={item} align="center">
          No new habit. Just your run.
        </SectionHeading>

        <ol className="mt-8 grid gap-3.5 md:mt-14 md:grid-cols-3 md:gap-6">
          {STEPS.map((step) => (
            <m.li
              key={step.number}
              variants={item}
              className="flex flex-col gap-3 rounded-3xl border border-brand-border/60 bg-[#121a45]
                         p-6 md:gap-3.5 md:p-8"
            >
              <span
                aria-hidden="true"
                className="font-display text-3xl font-bold text-brand-accent md:text-[2.5rem]"
              >
                {step.number}
              </span>
              <h3 className="text-xl font-bold md:text-[1.375rem]">{step.title}</h3>
              <p className="text-base leading-relaxed text-brand-ink-dim">{step.detail}</p>
            </m.li>
          ))}
        </ol>
      </m.div>
    </section>
  );
}
