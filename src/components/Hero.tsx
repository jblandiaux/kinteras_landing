import { m, useReducedMotion } from 'framer-motion';
import { EarlyAccessForm } from './EarlyAccessForm';
import { HeroVideo } from './HeroVideo';

/**
 * Everything a visitor needs in order to decide, in one screen.
 *
 * The form sits ABOVE the video, which inverts the usual trailer-then-CTA order,
 * for an arithmetic reason: the clip is 1:2.18, so on a 375px phone it is several
 * hundred pixels tall and anything below it starts far under the fold. Wordmark,
 * headline, pitch and form come to roughly 530px -- the CTA is reachable without
 * scrolling, and the video crests the fold just enough to pull the visitor down.
 *
 * Someone who only wants the proof still gets it: the video is the next thing
 * they see, and the closing CTA sends them back up to this same form.
 */
export function Hero() {
  const reducedMotion = useReducedMotion();

  // A short stagger on first paint. Under reduced motion every child renders in
  // its final state instead -- no fade, no travel.
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  };
  const item = reducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
      };

  return (
    <section className="px-5 pt-8 pb-16 sm:px-6 md:pt-12 md:pb-24">
      <m.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto grid max-w-[1100px] items-center gap-12
                   md:grid-cols-[minmax(0,1fr)_auto] md:gap-14"
      >
        <div className="text-center md:text-left">
          {/* The wordmark is the logo, not a nav bar: no links around it, nothing
              sticky, no header chrome. */}
          <m.img
            variants={item}
            src="/assets/logo/wordmark.png"
            alt="Kinteras"
            width={447}
            height={128}
            /* Native width is 447px, so 180-200 CSS px is already a 2x asset. */
            className="mx-auto h-auto w-[180px] md:mx-0 md:w-[210px]"
            fetchPriority="high"
          />

          <m.h1
            variants={item}
            className="mt-8 text-[2.75rem] leading-[1.02] font-extrabold tracking-[-0.02em]
                       text-balance sm:text-5xl md:mt-10 md:text-[4.25rem] lg:text-[4.75rem]"
          >
            {/* Two lines on small screens, one on wide ones: the break is where
                the sentence breaks, not wherever the box happens to run out. */}
            YOUR RUN
            <br />
            BECOMES AN RPG.
          </m.h1>

          <m.p
            variants={item}
            className="mx-auto mt-6 max-w-[500px] text-lg leading-relaxed text-brand-ink-dim
                       text-pretty md:mx-0"
          >
            Run in the real world. Level your creatures. Discover encounters. Fight your way
            through the world.
          </m.p>

          <m.div variants={item} className="mt-10 md:mt-12">
            <h2
              id="early-access"
              className="font-display text-xl tracking-[0.18em] text-brand-accent"
            >
              JOIN THE EARLY ACCESS
            </h2>
            <div className="mt-4 max-w-[520px] md:max-w-none">
              <EarlyAccessForm />
            </div>
          </m.div>
        </div>

        <m.div variants={item} className="flex justify-center md:justify-end">
          <HeroVideo />
        </m.div>
      </m.div>
    </section>
  );
}
