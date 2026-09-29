import { m } from 'framer-motion';
import { REVEAL_VIEWPORT, useRevealVariants } from '../lib/reveal';
import { SectionHeading } from './SectionHeading';

/** The campaign's zones, in the order a player unlocks them. */
const ZONES = [
  { slug: 'awakened-plains', name: 'Awakened Plains', numeral: 'I' },
  { slug: 'ash-caverns', name: 'Ash Caverns', numeral: 'II' },
  { slug: 'frozen-ruins', name: 'Frozen Ruins', numeral: 'III' },
  { slug: 'storm-isles', name: 'Storm Isles', numeral: 'IV' },
  { slug: 'ardent-nexus', name: 'Ardent Nexus', numeral: 'V' },
] as const;

const FINAL_ZONE = ZONES[ZONES.length - 1].slug;

/**
 * The world: the game's painted map beside the five zones as banner strips.
 *
 * The map is md-up only. On a phone it would be a 700px-tall image restating
 * what the five banners already say, so phones get the banners alone.
 */
export function World() {
  const item = useRevealVariants();

  return (
    <section
      id="world"
      aria-labelledby="world-title"
      className="bg-gradient-to-b from-brand-bg-deep to-brand-bg px-5 py-12 sm:px-6
                 md:px-10 md:py-24 lg:px-24"
    >
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        transition={{ staggerChildren: 0.08 }}
        className="mx-auto grid max-w-[1248px] gap-10 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]
                   md:gap-14 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-22"
      >
        <m.div
          variants={item}
          className="hidden overflow-hidden rounded-[28px] border border-brand-accent/35
                     shadow-[0_40px_100px_rgba(0,0,0,0.5)] md:block"
        >
          <img
            src="/assets/scenes/world-map.webp"
            alt="The world map of Kinteras, from green plains up to a volcanic citadel"
            width={688}
            height={1376}
            loading="lazy"
            decoding="async"
            className="block h-full w-full object-cover"
          />
        </m.div>

        <div className="flex flex-col gap-6 md:gap-9">
          <div className="flex flex-col gap-4">
            <SectionHeading id="world-title" eyebrow="THE WORLD" variants={item}>
              Five realms. <br className="hidden md:block" />
              One road north.
            </SectionHeading>
            <m.p
              variants={item}
              className="hidden max-w-[520px] text-lg leading-relaxed text-brand-ink-dim md:block"
            >
              Each run opens the path a little further. New zones. Stronger encounters. A boss at
              every gate.
            </m.p>
          </div>

          <ol className="flex flex-col gap-2 md:gap-3.5">
            {ZONES.map((zone) => (
              <m.li
                key={zone.slug}
                variants={item}
                className={`relative h-14 overflow-hidden rounded-[14px] border md:h-[104px]
                            md:rounded-[18px] ${
                              zone.slug === FINAL_ZONE ? 'border-brand-accent/40' : 'border-white/10'
                            }`}
              >
                <img
                  src={`/assets/zones/${zone.slug}.webp`}
                  alt=""
                  width={900}
                  height={300}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-brand-bg-deep/92
                             via-brand-bg-deep/55 to-brand-bg-deep/5"
                />
                <div className="relative flex h-full items-center gap-3.5 px-4 md:gap-5 md:px-7">
                  <span
                    aria-hidden="true"
                    className="w-7 font-display text-[0.8125rem] font-bold text-brand-accent md:w-9 md:text-base"
                  >
                    {zone.numeral}
                  </span>
                  <span className="font-display text-lg font-bold md:text-[1.625rem]">
                    {zone.name}
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
