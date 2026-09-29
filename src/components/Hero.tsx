import { m } from 'framer-motion';
import { useRevealVariants } from '../lib/reveal';
import { EarlyAccessForm } from './EarlyAccessForm';
import { HeroVideo } from './HeroVideo';
import { SiteHeader } from './SiteHeader';

/** A short stagger on first paint. */
const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/**
 * Everything a visitor needs in order to decide, in one screen.
 *
 * The game's night-road painting fills the section (see `scene-hero`): full
 * bleed from md up, a fixed band at the top on phones with the copy reading on
 * solid night below it.
 *
 * On phones the form sits ABOVE the video, for an arithmetic reason: the clip
 * is roughly 1:2.2, so on a 375px phone it is several hundred pixels tall and
 * anything below it starts far under the fold. The CTA stays reachable without
 * scrolling, and the video is the next thing the visitor sees.
 */
export function Hero() {
  const item = useRevealVariants();

  return (
    /*
     * overflow-x-clip contains the video's decorative halo, which is wider than
     * the column it sits in. `clip` rather than `hidden`: it does not create a
     * scroll container, so nothing gets clipped vertically.
     */
    <section className="scene-hero overflow-x-clip px-5 pb-14 sm:px-6 md:px-10 md:pb-24 lg:px-24">
      <div className="mx-auto max-w-[1248px]">
        <SiteHeader />

        <m.div
          variants={STAGGER}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-14 pt-[200px] md:grid-cols-[minmax(0,1fr)_auto]
                     md:gap-16 md:pt-16 lg:gap-20 lg:pt-20"
        >
          <div className="flex max-w-[700px] flex-col gap-5 md:gap-7">
            <m.p
              variants={item}
              className="inline-flex items-center gap-3 font-display text-xs font-semibold
                         tracking-[0.22em] text-brand-accent md:text-[0.9375rem]"
            >
              <span aria-hidden="true" className="block h-px w-6 bg-brand-accent md:w-9" />
              THE RUNNING RPG
            </m.p>

            <m.h1
              variants={item}
              className="font-display text-[2.875rem] leading-[1.02] font-bold text-balance
                         text-brand-ink-warm sm:text-6xl md:text-[4.5rem] md:leading-[0.98]
                         lg:text-[5.75rem]"
            >
              Your run becomes an RPG.
            </m.h1>

            <m.p
              variants={item}
              className="max-w-[520px] text-[1.0625rem] leading-relaxed text-pretty text-[#c3cedd]
                         md:text-[1.3125rem]"
            >
              Run in the real world. Level your creatures. Discover encounters. Fight your way
              through the world.
            </m.p>

            {/* The anchor every "Early access" link and the closing CTA land on. */}
            <m.div variants={item} id="early-access" className="mt-1 max-w-[560px] md:mt-3">
              <h2 className="screen-reader-only">Join the Early Access</h2>
              <EarlyAccessForm />
            </m.div>
          </div>

          <m.div variants={item} className="flex justify-center md:justify-end">
            <HeroVideo />
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
